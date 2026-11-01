using System.Net;
using System.Text.Json;
using deskgeek.Application.Email;
using deskgeek.Infra.Email;
using Microsoft.Extensions.Options;
using Xunit;

namespace deskgeek.Backend.Tests.Email;

public class BrevoEmailSenderTests
{
    [Fact]
    public async Task Send_UsesSameBrevoTransportAsGymFlow_AndStableIdempotency()
    {
        var handler = new RecordingHandler(HttpStatusCode.Created);
        var sender = new BrevoEmailSender(new HttpClient(handler), Options.Create(new BrevoOptions { ApiKey = "test-only", SenderEmail = "sender@example.test" }));
        await sender.SendAsync("recipient@example.test", "Lançou hoje", "<p>Anime</p>", "release-unique", default);
        Assert.Equal("https://api.brevo.com/v3/smtp/email", handler.Url);
        Assert.Equal("test-only", handler.ApiKey);
        using var body = JsonDocument.Parse(handler.Body!);
        Assert.Equal("MediaDex", body.RootElement.GetProperty("sender").GetProperty("name").GetString());
        Assert.Equal("recipient@example.test", body.RootElement.GetProperty("to")[0].GetProperty("email").GetString());
        Assert.Equal("release-unique", body.RootElement.GetProperty("headers").GetProperty("IdempotencyKey").GetString());
    }

    [Fact]
    public async Task Send_PropagatesProviderErrorsForRetry()
    {
        var sender = new BrevoEmailSender(new HttpClient(new RecordingHandler(HttpStatusCode.TooManyRequests)), Options.Create(new BrevoOptions { ApiKey = "test-only", SenderEmail = "sender@example.test" }));
        await Assert.ThrowsAsync<HttpRequestException>(() => sender.SendAsync("recipient@example.test", "Teste", "<p>Teste</p>", "key", default));
    }

    [Fact]
    public async Task Send_WithoutCredentials_DoesNotContactProvider()
    {
        var handler = new RecordingHandler(HttpStatusCode.Created);
        var sender = new BrevoEmailSender(new HttpClient(handler), Options.Create(new BrevoOptions()));
        await Assert.ThrowsAsync<InvalidOperationException>(() => sender.SendAsync("recipient@example.test", "Teste", "<p>Teste</p>", "key", default));
        Assert.Null(handler.Url);
    }

    [Fact]
    public async Task Template_EncodesUntrustedValues_AndIncludesPreferenceLinks()
    {
        await using var test = new EmailTestDatabase();
        test.User.Usuario = "<script>user</script>";
        test.Media.Nome = "<img src=x>";
        test.Media.UrlMidia = "javascript:alert(1)";
        var (_, html) = ReleaseEmailTemplate.Build(test.User, test.Media, test.Options.Value);
        Assert.DoesNotContain("<script>", html);
        Assert.DoesNotContain("<img src=x>", html);
        Assert.DoesNotContain("javascript:", html);
        Assert.Contains("&lt;img src=x&gt;", html);
        Assert.Contains("/configuracoes", html);
        Assert.Contains("/tabeladex", html);
    }

    private sealed class RecordingHandler(HttpStatusCode status) : HttpMessageHandler
    {
        public string? Url { get; private set; }
        public string? ApiKey { get; private set; }
        public string? Body { get; private set; }
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Url = request.RequestUri!.AbsoluteUri;
            ApiKey = request.Headers.GetValues("api-key").Single();
            Body = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(status);
        }
    }
}
