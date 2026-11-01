using System.Text.Json;
using deskgeek.Application.Email;
using deskgeek.Infra;
using deskgeek.Infra.Email;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace MediaDex.Worker;

public sealed class ReleaseReminderSchedulerWorker(IServiceScopeFactory scopes, IOptions<ReleaseReminderOptions> options, ILogger<ReleaseReminderSchedulerWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.Enabled) return;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopes.CreateScope();
                var count = await scope.ServiceProvider.GetRequiredService<ReleaseReminderScheduler>().ScheduleAsync(stoppingToken);
                if (count > 0) logger.LogInformation("Agendados {Count} lembretes de lançamento", count);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception) { logger.LogError(exception, "Falha no agendador de lembretes"); }
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}

public sealed class OutboxPublisher(IServiceScopeFactory scopes, IOptions<ReleaseReminderOptions> options, ILogger<OutboxPublisher> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.Enabled) return;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var bus = scope.ServiceProvider.GetRequiredService<IEventBus>();
                var pending = await db.OutboxMessages.Where(x => x.ProcessedAt == null).OrderBy(x => x.OccurredAt).Take(50).ToListAsync(stoppingToken);
                foreach (var message in pending)
                {
                    try
                    {
                        using var json = JsonDocument.Parse(message.Payload);
                        await bus.PublishAsync(message.Type, json.RootElement, message.IdempotencyKey, stoppingToken);
                        message.ProcessedAt = DateTimeOffset.UtcNow;
                    }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { throw; }
                    catch (Exception exception)
                    {
                        message.Attempts++;
                        logger.LogError(exception, "Falha publicando outbox {MessageId}", message.Id);
                    }
                    // Persist each confirm: a later failure never discards earlier successes.
                    await db.SaveChangesAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception) { logger.LogError(exception, "Falha no publicador de outbox"); }
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }
}

public sealed class ReleaseEmailConsumer(IServiceScopeFactory scopes, IOptions<ReleaseReminderOptions> options, ILogger<ReleaseEmailConsumer> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.Enabled) return;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopes.CreateScope();
                var connection = scope.ServiceProvider.GetRequiredService<IConnection>();
                using var channel = connection.CreateModel();
                EmailTopology.Declare(channel);
                channel.BasicQos(0, 1, false);
                var consumer = new AsyncEventingBasicConsumer(channel);
                consumer.Received += (_, args) => ReceiveAsync(channel, args, stoppingToken);
                channel.BasicConsume(EmailTopology.Queue, autoAck: false, consumer);
                await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception) { logger.LogError(exception, "Falha no consumidor de e-mails; reconectando"); }
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task ReceiveAsync(IModel channel, BasicDeliverEventArgs args, CancellationToken stoppingToken)
    {
        try
        {
            ReleaseEmailRequestedEvent message;
            try { message = JsonSerializer.Deserialize<ReleaseEmailRequestedEvent>(args.Body.Span) ?? throw new JsonException("Mensagem vazia."); }
            catch (JsonException)
            {
                logger.LogWarning("Mensagem inválida encaminhada à fila de falhas");
                channel.BasicNack(args.DeliveryTag, false, requeue: false);
                return;
            }
            using var scope = scopes.CreateScope();
            var result = await scope.ServiceProvider.GetRequiredService<ReleaseEmailDeliveryService>().DeliverAsync(message, stoppingToken);
            if (result.Outcome == DeliveryOutcome.Completed) channel.BasicAck(args.DeliveryTag, false);
            else if (result.Outcome == DeliveryOutcome.DeadLetter) channel.BasicNack(args.DeliveryTag, false, requeue: false);
            else
            {
                await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, Math.Clamp(result.Attempts, 1, 3))), stoppingToken);
                channel.BasicNack(args.DeliveryTag, false, requeue: true);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { /* Channel shutdown requeues unacknowledged deliveries. */ }
        catch (Exception exception)
        {
            logger.LogError(exception, "Falha na infraestrutura durante entrega de e-mail");
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                if (channel.IsOpen) channel.BasicNack(args.DeliveryTag, false, requeue: true);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
        }
    }
}
