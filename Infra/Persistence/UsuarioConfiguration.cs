using deskgeek.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace deskgeek.Infra.Persistence
{
    public class UsuarioConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Usuario");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Usuario)
                .HasColumnName("Name")
                .IsRequired()
                .HasMaxLength(100);
            builder.HasIndex(x => x.Usuario)
                .IsUnique();
            builder.Property(x => x.Email)
                .IsRequired()
                .HasMaxLength(200);
            builder.Property(x => x.Senha)
                .IsRequired()
                .HasMaxLength(200);

        }
    }
}
