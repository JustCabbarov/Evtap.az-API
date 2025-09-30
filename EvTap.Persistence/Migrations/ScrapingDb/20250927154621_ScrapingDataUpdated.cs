using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EvTap.Persistence.Migrations.ScrapingDb
{
    /// <inheritdoc />
    public partial class ScrapingDataUpdated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "ScrapingDatas",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "ScrapingDatas");
        }
    }
}
