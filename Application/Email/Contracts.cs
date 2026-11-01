namespace deskgeek.Application.Email;

public sealed record ReleaseEmailRequestedEvent(Guid DeliveryId, Guid UserId, Guid MediaId, DateOnly ReferenceDate, string IdempotencyKey);

public interface IEventBus
{
    Task PublishAsync<T>(string eventName, T message, string idempotencyKey, CancellationToken cancellationToken = default);
}

public interface IBrevoEmailSender
{
    Task SendAsync(string email, string subject, string html, string idempotencyKey, CancellationToken cancellationToken);
}

public sealed class BrevoOptions
{
    public string ApiKey { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderName { get; set; } = "MediaDex";
}

public sealed class ReleaseReminderOptions
{
    public bool Enabled { get; set; } = true;
    public int SendHour { get; set; } = 12;
    public string FrontendUrl { get; set; } = "https://mediadex.devporwillie.shop";
}
