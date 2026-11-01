using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace deskgeek.Migrations
{
    /// <inheritdoc />
    public partial class AddLibraryOrderAndAutoCompletion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OrdemPersonalizada",
                table: "MediaDex",
                type: "int",
                nullable: true);

            // Normalize existing completed works using actual watched/read progress only.
            migrationBuilder.Sql("""
                UPDATE [MediaDex]
                SET [Status] = N'Finalizado'
                WHERE TRY_CONVERT(int, LTRIM(RTRIM([TotalCapitulos]))) > 0
                  AND TRY_CONVERT(int, LTRIM(RTRIM([CapituloAtual]))) >= TRY_CONVERT(int, LTRIM(RTRIM([TotalCapitulos])))
                  AND ([Status] IS NULL OR [Status] <> N'Finalizado');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OrdemPersonalizada",
                table: "MediaDex");
        }
    }
}
