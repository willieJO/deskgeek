using System.Net.Http.Json;
using deskgeek.Application.Email;
using Microsoft.Extensions.Options;

namespace deskgeek.Infra.Email;

// Same provider and HTTP transport as GymFlow. The idempotency header also protects retries at Brevo.
public sealed class BrevoEmailSender(HttpClient client, IOptions<BrevoOptions> options) : IBrevoEmailSender
{
    public async Task SendAsync(string email, string subject, string html, string idempotencyKey, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.ApiKey) || string.IsNullOrWhiteSpace(settings.SenderEmail))
            throw new InvalidOperationException("Configure Brevo:ApiKey e Brevo:SenderEmail antes de iniciar os envios.");
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
        {
            Content = JsonContent.Create(new
            {
                sender = new { name = settings.SenderName, email = settings.SenderEmail },
                to = new[] { new { email } }, subject, htmlContent = html,
                tags = new[] { "mediadex-release" },
                headers = new Dictionary<string, string> { ["IdempotencyKey"] = idempotencyKey }
            })
        };
        request.Headers.Add("api-key", settings.ApiKey);
        using var response = await client.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}
