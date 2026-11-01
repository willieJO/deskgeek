using deskgeek.Application.Email;
using RabbitMQ.Client;

namespace deskgeek.Infra.Email;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddMediaDexEmailServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<BrevoOptions>().Bind(configuration.GetSection("Brevo"));
        services.AddOptions<ReleaseReminderOptions>().Bind(configuration.GetSection("ReleaseReminders"))
            .Validate(x => x.SendHour is >= 0 and <= 23, "ReleaseReminders:SendHour deve estar entre 0 e 23.")
            .Validate(x => Uri.TryCreate(x.FrontendUrl, UriKind.Absolute, out var uri) && (uri.Scheme == "https" || uri.Scheme == "http"), "ReleaseReminders:FrontendUrl deve ser HTTP/HTTPS.");
        services.AddHttpClient<IBrevoEmailSender, BrevoEmailSender>(client => client.Timeout = TimeSpan.FromSeconds(30));
        services.AddScoped<ReleaseReminderScheduler>();
        services.AddScoped<ReleaseEmailDeliveryService>();
        return services;
    }

    public static IServiceCollection AddMediaDexEmailBroker(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IConnection>(_ => new ConnectionFactory
        {
            Uri = new Uri(configuration["RabbitMq:ConnectionString"] ?? "amqp://guest:guest@localhost:5672/"),
            DispatchConsumersAsync = true,
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(5),
            RequestedConnectionTimeout = TimeSpan.FromSeconds(10),
            ClientProvidedName = "mediadex-email-worker"
        }.CreateConnection());
        services.AddSingleton<IEventBus, RabbitMqEventBus>();
        return services;
    }
}
