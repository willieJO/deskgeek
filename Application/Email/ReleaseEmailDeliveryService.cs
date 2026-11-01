using deskgeek.Application.Services;
using deskgeek.Infra;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace deskgeek.Application.Email;

public enum DeliveryOutcome { Completed, Retry, DeadLetter, Busy }
public sealed record DeliveryResult(DeliveryOutcome Outcome, int Attempts = 0);

public sealed class ReleaseEmailDeliveryService(AppDbContext db, IBrevoEmailSender sender, IMediaProgressionService progression,
    TimeProvider time, IOptions<ReleaseReminderOptions> options, ILogger<ReleaseEmailDeliveryService> logger)
{
    public const int MaxAttempts = 3;

    public async Task<DeliveryResult> DeliverAsync(ReleaseEmailRequestedEvent message, CancellationToken cancellationToken)
    {
        var existing = await db.EmailDeliveries.AsNoTracking().SingleOrDefaultAsync(x => x.Id == message.DeliveryId, cancellationToken);
        if (existing is null || existing.UserId != message.UserId || existing.MediaId != message.MediaId || existing.ReferenceDate != message.ReferenceDate
            || existing.IdempotencyKey != message.IdempotencyKey) return new(DeliveryOutcome.DeadLetter);
        if (existing.SentAt.HasValue || existing.SkippedAt.HasValue) return new(DeliveryOutcome.Completed);
        if (existing.AttemptCount >= MaxAttempts) return new(DeliveryOutcome.DeadLetter, existing.AttemptCount);

        var now = time.GetUtcNow();
        var leaseId = Guid.NewGuid();
        var claimed = await db.EmailDeliveries.Where(x => x.Id == existing.Id && x.SentAt == null && x.SkippedAt == null && x.AttemptCount < MaxAttempts
                && (x.LeaseUntilUtc == null || x.LeaseUntilUtc <= now))
            .ExecuteUpdateAsync(update => update.SetProperty(x => x.LeaseId, leaseId).SetProperty(x => x.LeaseUntilUtc, now.AddMinutes(5)), cancellationToken);
        if (claimed == 0) return new(DeliveryOutcome.Busy);

        var delivery = await db.EmailDeliveries.SingleAsync(x => x.Id == message.DeliveryId, cancellationToken);
        var log = await db.EmailDeliveryLogs.SingleAsync(x => x.IdempotencyKey == message.IdempotencyKey, cancellationToken);
        try
        {
            // Use current preferences and ownership; queued messages never override opt-outs.
            var user = await db.Usuarios.AsNoTracking().SingleOrDefaultAsync(x => x.Id == message.UserId, cancellationToken);
            var media = await db.MediaDex.AsNoTracking().SingleOrDefaultAsync(x => x.Id == message.MediaId && x.UserId == message.UserId, cancellationToken);
            if (!options.Value.Enabled || user is null || !user.ReceberEmailsLancamentos || media is null
                || message.ReferenceDate != ReleaseReminderRules.LocalDate(now) || !ReleaseReminderRules.IsScheduledFor(media, message.ReferenceDate, progression))
            {
                delivery.SkippedAt = now;
                delivery.LeaseId = null;
                delivery.LeaseUntilUtc = null;
                log.Status = "Skipped";
                log.UpdatedAt = now;
                log.LastError = null;
                await db.SaveChangesAsync(cancellationToken);
                return new(DeliveryOutcome.Completed);
            }

            delivery.AttemptCount++;
            log.AttemptCount = delivery.AttemptCount;
            log.Status = "Sending";
            log.UpdatedAt = now;
            log.LastError = null;
            await db.SaveChangesAsync(cancellationToken);

            var (subject, html) = ReleaseEmailTemplate.Build(user, media, options.Value);
            await sender.SendAsync(user.Email, subject, html, message.IdempotencyKey, cancellationToken);
            delivery.SentAt = time.GetUtcNow();
            delivery.LeaseId = null;
            delivery.LeaseUntilUtc = null;
            log.Status = "Sent";
            log.SentAt = delivery.SentAt;
            log.UpdatedAt = delivery.SentAt.Value;
            await db.SaveChangesAsync(cancellationToken);
            return new(DeliveryOutcome.Completed, delivery.AttemptCount);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Falha no lembrete {DeliveryId}, tentativa {Attempt}", delivery.Id, delivery.AttemptCount);
            delivery.SentAt = null;
            delivery.LeaseId = null;
            delivery.LeaseUntilUtc = null;
            log.Status = "Failed";
            log.SentAt = null;
            log.UpdatedAt = time.GetUtcNow();
            log.LastError = exception.Message[..Math.Min(exception.Message.Length, 4000)];
            await db.SaveChangesAsync(cancellationToken);
            return new(delivery.AttemptCount >= MaxAttempts ? DeliveryOutcome.DeadLetter : DeliveryOutcome.Retry, delivery.AttemptCount);
        }
    }
}
