using deskgeek.Application.Email;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace deskgeek.Backend.Tests.Email;

public class ReleaseReminderTests
{
    [Fact]
    public async Task Schedule_StartsAtNoonInSaoPaulo_AndRecoversLaterTheSameDay()
    {
        await using var test = new EmailTestDatabase();
        test.Time.Now = new DateTimeOffset(2026, 10, 31, 14, 59, 0, TimeSpan.Zero);
        Assert.Equal(0, await test.Scheduler.ScheduleAsync(default));
        test.Time.Now = test.Time.Now.AddMinutes(1);
        Assert.Equal(1, await test.Scheduler.ScheduleAsync(default));
        test.Time.Now = test.Time.Now.AddHours(8);
        Assert.Equal(0, await test.Scheduler.ScheduleAsync(default));
    }

    [Fact]
    public async Task Schedule_IsIdempotentAcrossSchedulerInstances_WithAtomicOutbox()
    {
        await using var test = new EmailTestDatabase();
        Assert.Equal(1, await test.Scheduler.ScheduleAsync(default));
        Assert.Equal(0, await test.Scheduler.ScheduleAsync(default));
        Assert.Single(await test.Db.OutboxMessages.ToListAsync());
        Assert.Single(await test.Db.EmailDeliveries.ToListAsync());
        Assert.Single(await test.Db.EmailDeliveryLogs.ToListAsync());
        var delivery = await test.Db.EmailDeliveries.SingleAsync();
        Assert.Equal(delivery.IdempotencyKey, (await test.Db.OutboxMessages.SingleAsync()).IdempotencyKey);
    }

    [Theory]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(false, false)]
    public async Task Schedule_RespectsBothPreferenceLevels(bool userEnabled, bool mediaEnabled)
    {
        await using var test = new EmailTestDatabase();
        await test.Db.Usuarios.ExecuteUpdateAsync(x => x.SetProperty(u => u.ReceberEmailsLancamentos, userEnabled));
        await test.Db.MediaDex.ExecuteUpdateAsync(x => x.SetProperty(m => m.NotificarLancamentos, mediaEnabled));
        Assert.Equal(0, await test.Scheduler.ScheduleAsync(default));
        Assert.Empty(await test.Db.OutboxMessages.ToListAsync());
    }

    [Theory]
    [InlineData("Finalizado", "Sábado")]
    [InlineData("Inativo", "Sábado")]
    [InlineData("Em andamento", "Segunda-feira")]
    [InlineData("Em andamento", "dia inválido")]
    [InlineData("Em andamento", null)]
    public async Task Schedule_SkipsInactiveAndWrongWeekdays(string status, string? day)
    {
        await using var test = new EmailTestDatabase();
        await test.Db.MediaDex.ExecuteUpdateAsync(x => x.SetProperty(m => m.Status, status).SetProperty(m => m.DiaNovoCapitulo, day));
        Assert.Equal(0, await test.Scheduler.ScheduleAsync(default));
    }

    [Fact]
    public async Task Schedule_IncludesLastEpisode_ButStopsFollowingWeeks()
    {
        await using var test = new EmailTestDatabase();
        await test.Db.MediaDex.ExecuteUpdateAsync(x => x.SetProperty(m => m.TotalCapitulos, "2"));
        test.Time.Now = test.Time.Now.AddDays(7);
        Assert.Equal(1, await test.Scheduler.ScheduleAsync(default));
        test.Time.Now = test.Time.Now.AddDays(7);
        Assert.Equal(0, await test.Scheduler.ScheduleAsync(default));
    }

    [Fact]
    public async Task Schedule_SupportsUnknownTotal_ButSkipsFullyWatchedMedia()
    {
        await using var test = new EmailTestDatabase();
        await test.Db.MediaDex.ExecuteUpdateAsync(x => x.SetProperty(m => m.TotalCapitulos, "1"));
        Assert.Equal(0, await test.Scheduler.ScheduleAsync(default));
        await test.Db.MediaDex.ExecuteUpdateAsync(x => x.SetProperty(m => m.TotalCapitulos, (string?)null));
        Assert.Equal(1, await test.Scheduler.ScheduleAsync(default));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Delivery_RechecksPreferencesAfterQueueing(bool userPreference)
    {
        await using var test = new EmailTestDatabase();
        var message = await test.ScheduleAsync();
        if (userPreference) await test.Db.Usuarios.ExecuteUpdateAsync(x => x.SetProperty(u => u.ReceberEmailsLancamentos, false));
        else await test.Db.MediaDex.ExecuteUpdateAsync(x => x.SetProperty(m => m.NotificarLancamentos, false));
        test.Db.ChangeTracker.Clear();
        var result = await test.Delivery.DeliverAsync(message, default);
        Assert.Equal(DeliveryOutcome.Completed, result.Outcome);
        test.Sender.Verify(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        Assert.Equal("Skipped", (await test.Db.EmailDeliveryLogs.SingleAsync()).Status);
    }

    [Fact]
    public async Task Delivery_DuplicateMessage_DoesNotSendTwice()
    {
        await using var test = new EmailTestDatabase();
        var message = await test.ScheduleAsync();
        Assert.Equal(DeliveryOutcome.Completed, (await test.Delivery.DeliverAsync(message, default)).Outcome);
        test.Db.ChangeTracker.Clear();
        Assert.Equal(DeliveryOutcome.Completed, (await test.Delivery.DeliverAsync(message, default)).Outcome);
        test.Sender.Verify(x => x.SendAsync(test.User.Email, It.IsAny<string>(), It.IsAny<string>(), message.IdempotencyKey, It.IsAny<CancellationToken>()), Times.Once);
        Assert.Equal("Sent", (await test.Db.EmailDeliveryLogs.SingleAsync()).Status);
    }

    [Fact]
    public async Task Delivery_ThreeFailuresPersistAcrossServices_ThenDeadLetter()
    {
        await using var test = new EmailTestDatabase();
        var message = await test.ScheduleAsync();
        test.Sender.Setup(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ThrowsAsync(new HttpRequestException("Provider unavailable"));
        for (var attempt = 1; attempt <= 3; attempt++)
        {
            test.Db.ChangeTracker.Clear();
            var result = await test.Delivery.DeliverAsync(message, default);
            Assert.Equal(attempt, result.Attempts);
            Assert.Equal(attempt == 3 ? DeliveryOutcome.DeadLetter : DeliveryOutcome.Retry, result.Outcome);
        }
        test.Db.ChangeTracker.Clear();
        Assert.Equal(DeliveryOutcome.DeadLetter, (await test.Delivery.DeliverAsync(message, default)).Outcome);
        test.Sender.Verify(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Exactly(3));
        Assert.Equal(3, (await test.Db.EmailDeliveryLogs.SingleAsync()).AttemptCount);
    }

    [Fact]
    public async Task Delivery_ActiveLeasePreventsConcurrentDelivery_AndExpiredLeaseRecovers()
    {
        await using var test = new EmailTestDatabase();
        var message = await test.ScheduleAsync();
        var otherLease = Guid.NewGuid();
        await test.Db.EmailDeliveries.ExecuteUpdateAsync(x => x.SetProperty(d => d.LeaseId, otherLease).SetProperty(d => d.LeaseUntilUtc, test.Time.Now.AddMinutes(5)));
        test.Db.ChangeTracker.Clear();
        Assert.Equal(DeliveryOutcome.Busy, (await test.Delivery.DeliverAsync(message, default)).Outcome);
        test.Time.Now = test.Time.Now.AddMinutes(6);
        Assert.Equal(DeliveryOutcome.Completed, (await test.Delivery.DeliverAsync(message, default)).Outcome);
        test.Sender.Verify(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Delivery_DiscardsStaleDates()
    {
        await using var test = new EmailTestDatabase();
        var message = await test.ScheduleAsync();
        test.Time.Now = test.Time.Now.AddDays(1);
        Assert.Equal(DeliveryOutcome.Completed, (await test.Delivery.DeliverAsync(message, default)).Outcome);
        test.Sender.Verify(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("deleted")]
    [InlineData("status")]
    [InlineData("day")]
    public async Task Delivery_RechecksDeletedMediaStatusAndSchedule(string change)
    {
        await using var test = new EmailTestDatabase();
        var message = await test.ScheduleAsync();
        if (change == "deleted") await test.Db.MediaDex.ExecuteDeleteAsync();
        else if (change == "status") await test.Db.MediaDex.ExecuteUpdateAsync(x => x.SetProperty(m => m.Status, "Finalizado"));
        else await test.Db.MediaDex.ExecuteUpdateAsync(x => x.SetProperty(m => m.DiaNovoCapitulo, "Segunda-feira"));
        test.Db.ChangeTracker.Clear();
        Assert.Equal(DeliveryOutcome.Completed, (await test.Delivery.DeliverAsync(message, default)).Outcome);
        test.Sender.Verify(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Delivery_RejectsForgedOwnership()
    {
        await using var test = new EmailTestDatabase();
        var message = await test.ScheduleAsync();
        Assert.Equal(DeliveryOutcome.DeadLetter, (await test.Delivery.DeliverAsync(message with { UserId = Guid.NewGuid() }, default)).Outcome);
        test.Sender.Verify(x => x.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Preferences_FalseIsPersistedDespiteTrueDatabaseDefaults()
    {
        await using var test = new EmailTestDatabase();
        var user = await test.Db.Usuarios.SingleAsync();
        var media = await test.Db.MediaDex.SingleAsync();
        user.ReceberEmailsLancamentos = false;
        media.NotificarLancamentos = false;
        await test.Db.SaveChangesAsync();
        test.Db.ChangeTracker.Clear();
        Assert.False((await test.Db.Usuarios.SingleAsync()).ReceberEmailsLancamentos);
        Assert.False((await test.Db.MediaDex.SingleAsync()).NotificarLancamentos);
    }

    [Theory]
    [InlineData("2026-11-01T01:00:00Z", "2026-10-31")]
    [InlineData("2026-11-01T03:00:00Z", "2026-11-01")]
    public void DateBoundary_IsSaoPaulo(string timestamp, string expected) =>
        Assert.Equal(DateOnly.Parse(expected), ReleaseReminderRules.LocalDate(DateTimeOffset.Parse(timestamp)));
}
