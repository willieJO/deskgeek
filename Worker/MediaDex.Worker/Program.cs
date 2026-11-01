using System.Net.Mail;
using deskgeek.Application.Email;
using deskgeek.Application.Services;
using deskgeek.Infra;
using deskgeek.Infra.Email;
using MediaDex.Worker;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings { Args = args, ContentRootPath = AppContext.BaseDirectory });
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<IMediaProgressionService, MediaProgressionService>();
builder.Services.AddMediaDexEmailServices(builder.Configuration);
builder.Services.AddMediaDexEmailBroker(builder.Configuration);
var enabled = builder.Configuration.GetValue("ReleaseReminders:Enabled", true);
builder.Services.AddOptions<BrevoOptions>().Validate(x => !enabled || (!string.IsNullOrWhiteSpace(x.ApiKey) && MailAddress.TryCreate(x.SenderEmail, out _)),
    "Configure Brevo:ApiKey e Brevo:SenderEmail para iniciar o worker de e-mails.").ValidateOnStart();
builder.Services.AddOptions<ReleaseReminderOptions>().ValidateOnStart();
builder.Services.AddHostedService<ReleaseReminderSchedulerWorker>();
builder.Services.AddHostedService<OutboxPublisher>();
builder.Services.AddHostedService<ReleaseEmailConsumer>();
using var host = builder.Build();
_ = host.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<BrevoOptions>>().Value;
_ = host.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<ReleaseReminderOptions>>().Value;
if (enabled)
{
    using var scope = host.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var pending = await db.Database.GetPendingMigrationsAsync();
    if (pending.Any()) throw new InvalidOperationException("Aplique as migrations do MediaDex antes de iniciar o worker: dotnet ef database update --project deskgeek.csproj");
}
await host.RunAsync();
