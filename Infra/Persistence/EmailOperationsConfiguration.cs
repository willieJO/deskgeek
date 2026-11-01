using deskgeek.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace deskgeek.Infra.Persistence;

public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("OutboxMessages");
        builder.Property(x => x.Type).HasMaxLength(120);
        builder.Property(x => x.IdempotencyKey).HasMaxLength(200);
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
        builder.HasIndex(x => new { x.ProcessedAt, x.OccurredAt });
    }
}

public sealed class EmailDeliveryConfiguration : IEntityTypeConfiguration<EmailDelivery>
{
    public void Configure(EntityTypeBuilder<EmailDelivery> builder)
    {
        builder.ToTable("EmailDeliveries");
        builder.Property(x => x.IdempotencyKey).HasMaxLength(200);
        builder.Property(x => x.Kind).HasMaxLength(80);
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.MediaId, x.ReferenceDate }).IsUnique();
    }
}

public sealed class EmailDeliveryLogConfiguration : IEntityTypeConfiguration<EmailDeliveryLog>
{
    public void Configure(EntityTypeBuilder<EmailDeliveryLog> builder)
    {
        builder.ToTable("EmailDeliveryLogs");
        builder.Property(x => x.IdempotencyKey).HasMaxLength(200);
        builder.Property(x => x.Kind).HasMaxLength(80);
        builder.Property(x => x.Status).HasMaxLength(30);
        builder.Property(x => x.LastError).HasMaxLength(4000);
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
    }
}

public sealed class MediaEmailPreferenceConfiguration : IEntityTypeConfiguration<MediaDex>
{
    public void Configure(EntityTypeBuilder<MediaDex> builder) =>
        builder.Property(x => x.NotificarLancamentos).HasDefaultValue(true);
}
