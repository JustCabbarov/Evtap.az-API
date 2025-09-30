using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EvTap.Persistence.Migrations.ScrapingDb
{
    /// <inheritdoc />
    public partial class SupabaseConnecting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ScrapingDatas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ExternalId = table.Column<string>(type: "text", nullable: false),
                    City = table.Column<string>(type: "text", nullable: true),
                    Location = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric", nullable: true),
                    Currency = table.Column<string>(type: "text", nullable: true),
                    Area = table.Column<double>(type: "double precision", nullable: true),
                    AreaUnit = table.Column<string>(type: "text", nullable: true),
                    Rooms = table.Column<int>(type: "integer", nullable: true),
                    Floor = table.Column<int>(type: "integer", nullable: true),
                    TotalFloors = table.Column<int>(type: "integer", nullable: true),
                    HasRepair = table.Column<bool>(type: "boolean", nullable: true),
                    HasMortgage = table.Column<bool>(type: "boolean", nullable: true),
                    HasBillOfSale = table.Column<bool>(type: "boolean", nullable: true),
                    Leased = table.Column<bool>(type: "boolean", nullable: true),
                    Vipped = table.Column<bool>(type: "boolean", nullable: true),
                    Featured = table.Column<bool>(type: "boolean", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScrapingDatas", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ScrapingDatas_ExternalId",
                table: "ScrapingDatas",
                column: "ExternalId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScrapingDatas");
        }
    }
}
