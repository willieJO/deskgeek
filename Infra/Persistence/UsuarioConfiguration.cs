using APIFinancia.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace APIFinancia.Infra.Persistence
{
    public class UsuarioConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("Usuario");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(100);
            builder.Property(x => x.Email)
                .IsRequired()
                .HasMaxLength(200);
            builder.Property(x => x.Senha)
                .IsRequired()
                .HasMaxLength(200);

        }
    }
}
