using deskgeek.Infra;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace deskgeek.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260302120000_AddCapituloEsperadoMediaDex")]
    public partial class AddCapituloEsperadoMediaDex : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CapituloEsperadoBase",
                table: "MediaDex",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CapituloEsperadoReferenciaUtc",
                table: "MediaDex",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE [MediaDex]
                SET
                    [CapituloEsperadoBase] = CASE
                        WHEN TRY_CONVERT(int, LTRIM(RTRIM([CapituloAtual]))) IS NOT NULL
                             AND TRY_CONVERT(int, LTRIM(RTRIM([CapituloAtual]))) >= 0
                            THEN TRY_CONVERT(int, LTRIM(RTRIM([CapituloAtual])))
                        ELSE 0
                    END,
                    [CapituloEsperadoReferenciaUtc] = TODATETIMEOFFSET(SYSUTCDATETIME(), '+00:00')
                WHERE [CapituloEsperadoBase] IS NULL OR [CapituloEsperadoReferenciaUtc] IS NULL;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CapituloEsperadoBase",
                table: "MediaDex");

            migrationBuilder.DropColumn(
                name: "CapituloEsperadoReferenciaUtc",
                table: "MediaDex");
        }
    }
}
