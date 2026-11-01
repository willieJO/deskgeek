using System.Text.Json;
using deskgeek.Application.Services;
using deskgeek.Domain;
using deskgeek.Infra;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace deskgeek.Application.Email;

public sealed class ReleaseReminderScheduler(AppDbContext db, IMediaProgressionService progression, TimeProvider time, IOptions<ReleaseReminderOptions> options)
{
    public async Task<int> ScheduleAsync(CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        var localNow = TimeZoneInfo.ConvertTime(now, ReleaseReminderRules.SaoPaulo);
        if (!options.Value.Enabled || localNow.Hour < options.Value.SendHour) return 0;
        var today = DateOnly.FromDateTime(localNow.DateTime);
        var candidates = await (from media in db.MediaDex.AsNoTracking()
                                join user in db.Usuarios.AsNoTracking() on media.UserId equals user.Id
                                where media.NotificarLancamentos && user.ReceberEmailsLancamentos && media.Status == "Em andamento" && media.DiaNovoCapitulo != null
                                select media).ToListAsync(cancellationToken);
        var existing = (await db.EmailDeliveries.Where(x => x.ReferenceDate == today).Select(x => x.IdempotencyKey).ToListAsync(cancellationToken)).ToHashSet();
        var scheduled = 0;
        foreach (var media in candidates)
        {
            if (!ReleaseReminderRules.IsScheduledFor(media, today, progression)) continue;
            var key = ReleaseReminderRules.IdempotencyKey(media.UserId, media.Id, today);
            if (!existing.Add(key)) continue;
            // The unique index and transaction cover concurrent schedulers and process restarts.
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var delivery = new EmailDelivery { UserId = media.UserId, MediaId = media.Id, ReferenceDate = today, IdempotencyKey = key, CreatedAt = now };
                var message = new ReleaseEmailRequestedEvent(delivery.Id, delivery.UserId, delivery.MediaId, today, key);
                db.EmailDeliveries.Add(delivery);
                db.EmailDeliveryLogs.Add(new EmailDeliveryLog { UserId = media.UserId, IdempotencyKey = key, CreatedAt = now, UpdatedAt = now });
                db.OutboxMessages.Add(new OutboxMessage { Type = nameof(ReleaseEmailRequestedEvent), IdempotencyKey = key, OccurredAt = now, Payload = JsonSerializer.Serialize(message) });
                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                scheduled++;
            }
            catch (DbUpdateException)
            {
                await transaction.RollbackAsync(cancellationToken);
                db.ChangeTracker.Clear();
                if (!await db.EmailDeliveries.AnyAsync(x => x.IdempotencyKey == key, cancellationToken)) throw;
            }
        }
        return scheduled;
    }
}
