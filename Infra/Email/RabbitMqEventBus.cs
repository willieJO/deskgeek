using System.Text;
using System.Text.Json;
using deskgeek.Application.Email;
using RabbitMQ.Client;

namespace deskgeek.Infra.Email;

public static class EmailTopology
{
    public const string Exchange = "mediadex.events";
    public const string DeadLetterExchange = "mediadex.dlx";
    public const string Queue = "mediadex.email";
    public const string DeadLetterQueue = "mediadex.email.dead";
    public const string RoutingKey = nameof(ReleaseEmailRequestedEvent);

    public static void Declare(IModel channel)
    {
        channel.ExchangeDeclare(Exchange, ExchangeType.Topic, durable: true);
        channel.ExchangeDeclare(DeadLetterExchange, ExchangeType.Fanout, durable: true);
        channel.QueueDeclare(Queue, durable: true, exclusive: false, autoDelete: false,
            arguments: new Dictionary<string, object> { ["x-dead-letter-exchange"] = DeadLetterExchange });
        channel.QueueDeclare(DeadLetterQueue, durable: true, exclusive: false, autoDelete: false);
        channel.QueueBind(Queue, Exchange, RoutingKey);
        channel.QueueBind(DeadLetterQueue, DeadLetterExchange, "");
    }
}

public sealed class RabbitMqEventBus : IEventBus, IDisposable
{
    private readonly IModel _channel;
    private readonly object _sync = new();
    private volatile bool _returned;

    public RabbitMqEventBus(IConnection connection)
    {
        _channel = connection.CreateModel();
        EmailTopology.Declare(_channel);
        _channel.ConfirmSelect();
        _channel.BasicReturn += (_, _) => _returned = true;
    }

    public Task PublishAsync<T>(string eventName, T message, string idempotencyKey, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_sync)
        {
            var properties = _channel.CreateBasicProperties();
            properties.Persistent = true;
            properties.MessageId = idempotencyKey;
            properties.ContentType = "application/json";
            _returned = false;
            _channel.BasicPublish(EmailTopology.Exchange, eventName, mandatory: true, properties, Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message)));
            _channel.WaitForConfirmsOrDie(TimeSpan.FromSeconds(10));
            if (_returned) throw new IOException("RabbitMQ devolveu a mensagem sem fila de destino.");
        }
        return Task.CompletedTask;
    }

    public void Dispose() => _channel.Dispose();
}
