using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace deskgeek.Migrations
{
    /// <inheritdoc />
    public partial class AddTipoMidiaMediaDex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TipoMidia",
                table: "MediaDex",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TipoMidia",
                table: "MediaDex");
        }
    }
}
