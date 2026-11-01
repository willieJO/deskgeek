using deskgeek.Domain;
using Microsoft.EntityFrameworkCore;

namespace deskgeek.Infra
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        public DbSet<User> Usuarios { get; set; }
        public DbSet<MediaDex> MediaDex { get; set; }
        public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
        public DbSet<EmailDelivery> EmailDeliveries => Set<EmailDelivery>();
        public DbSet<EmailDeliveryLog> EmailDeliveryLogs => Set<EmailDeliveryLog>();
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }
    }
}
