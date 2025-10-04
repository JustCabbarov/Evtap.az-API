using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EvTap.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FilterFixed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "1bb7dc6d-34eb-494b-b462-81d7312f0f64");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "8176ea82-f82e-4077-bf94-a5b10a5825b4");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "93bbf00e-8e9b-4c1a-ac10-39cd2bd24e6c");

            migrationBuilder.AddColumn<string>(
                name: "MetroStationIds",
                table: "ListingFilters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "051c99c7-f6cc-482f-be92-326035f1db28", null, "Admin", "ADMIN" },
                    { "16800571-dafb-4c1f-8160-b6b3f56a8b9b", null, "Agency", "AGENCY" },
                    { "b96cd81a-a0a8-4cac-8ab8-ab85a1afd92e", null, "User", "USER" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "051c99c7-f6cc-482f-be92-326035f1db28");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "16800571-dafb-4c1f-8160-b6b3f56a8b9b");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "b96cd81a-a0a8-4cac-8ab8-ab85a1afd92e");

            migrationBuilder.DropColumn(
                name: "MetroStationIds",
                table: "ListingFilters");

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "1bb7dc6d-34eb-494b-b462-81d7312f0f64", null, "Admin", "ADMIN" },
                    { "8176ea82-f82e-4077-bf94-a5b10a5825b4", null, "Agency", "AGENCY" },
                    { "93bbf00e-8e9b-4c1a-ac10-39cd2bd24e6c", null, "User", "USER" }
                });
        }
    }
}
