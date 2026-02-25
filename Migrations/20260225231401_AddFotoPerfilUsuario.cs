using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace deskgeek.Migrations
{
    /// <inheritdoc />
    public partial class AddFotoPerfilUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FotoPerfilArquivo",
                table: "Usuario",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FotoPerfilArquivo",
                table: "Usuario");
        }
    }
}
