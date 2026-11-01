using deskgeek.Application.Email;
using deskgeek.Application.Services;
using deskgeek.Domain;
using deskgeek.Infra;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace deskgeek.Backend.Tests.Email;

internal sealed class EmailTestDbContext(DbContextOptions<AppDbContext> options) : AppDbContext(options)
{
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        // SQLite has no DateTimeOffset comparison support; store UTC ticks for relational tests.
        foreach (var entity in builder.Model.GetEntityTypes())
        foreach (var property in entity.GetProperties())
        {
            if (property.ClrType == typeof(DateTimeOffset)) property.SetValueConverter(new ValueConverter<DateTimeOffset, long>(x => x.UtcTicks, x => new DateTimeOffset(x, TimeSpan.Zero)));
            else if (property.ClrType == typeof(DateTimeOffset?)) property.SetValueConverter(new ValueConverter<DateTimeOffset?, long?>(x => x.HasValue ? x.Value.UtcTicks : null, x => x.HasValue ? new DateTimeOffset(x.Value, TimeSpan.Zero) : null));
        }
    }
}

internal sealed class MutableTimeProvider : TimeProvider
{
    public DateTimeOffset Now { get; set; } = new(2026, 10, 31, 15, 0, 0, TimeSpan.Zero); // Saturday, noon Sao Paulo.
    public override DateTimeOffset GetUtcNow() => Now;
}

internal sealed class EmailTestDatabase : IAsyncDisposable
{
    private readonly SqliteConnection _connection;
    public EmailTestDbContext Db { get; }
    public MutableTimeProvider Time { get; } = new();
    public IOptions<ReleaseReminderOptions> Options { get; } = Microsoft.Extensions.Options.Options.Create(new ReleaseReminderOptions());
    public Mock<IBrevoEmailSender> Sender { get; } = new();
    public MediaProgressionService Progression => new(Time);
    public User User { get; } = new() { Usuario = "willi", Email = "user@example.test", Senha = "hash" };
    public MediaDex Media { get; }
    public ReleaseReminderScheduler Scheduler => new(Db, Progression, Time, Options);
    public ReleaseEmailDeliveryService Delivery => new(Db, Sender.Object, Progression, Time, Options, NullLogger<ReleaseEmailDeliveryService>.Instance);

    public EmailTestDatabase()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        Db = new EmailTestDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options);
        Db.Database.EnsureCreated();
        Media = new MediaDex { Nome = "Anime de teste", UserId = User.Id, Status = "Em andamento", TipoMidia = "Anime", DiaNovoCapitulo = "Sábado", CapituloAtual = "1", TotalCapitulos = "12", CapituloEsperadoBase = 1, CapituloEsperadoReferenciaUtc = Time.Now };
        Db.AddRange(User, Media);
        Db.SaveChanges();
        Db.ChangeTracker.Clear();
    }

    public async Task<ReleaseEmailRequestedEvent> ScheduleAsync()
    {
        await Scheduler.ScheduleAsync(default);
        var row = await Db.EmailDeliveries.AsNoTracking().SingleAsync();
        return new(row.Id, row.UserId, row.MediaId, row.ReferenceDate, row.IdempotencyKey);
    }

    public async ValueTask DisposeAsync()
    {
        await Db.DisposeAsync();
        await _connection.DisposeAsync();
    }
}
