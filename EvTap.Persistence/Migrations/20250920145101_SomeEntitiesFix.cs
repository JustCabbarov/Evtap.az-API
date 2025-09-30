using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EvTap.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SomeEntitiesFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "04d09b45-e31d-40ae-b39d-89762bcbd38e");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "87647733-315a-4cb9-8355-4b73d6897a0b");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "b7bec298-7714-4da2-b4ae-7bc1b8c32a6c");

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "998d02eb-baa8-41cf-8b06-19273be70bf1", null, "Admin", "ADMIN" },
                    { "a917c6ca-dc7d-4d39-834e-b45f4cf24778", null, "Agency", "AGENCY" },
                    { "d1d5212d-d109-48a0-82a6-60556f1fd31d", null, "User", "USER" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "998d02eb-baa8-41cf-8b06-19273be70bf1");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "a917c6ca-dc7d-4d39-834e-b45f4cf24778");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "d1d5212d-d109-48a0-82a6-60556f1fd31d");

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "04d09b45-e31d-40ae-b39d-89762bcbd38e", null, "User", "USER" },
                    { "87647733-315a-4cb9-8355-4b73d6897a0b", null, "Agency", "AGENCY" },
                    { "b7bec298-7714-4da2-b4ae-7bc1b8c32a6c", null, "Admin", "ADMIN" }
                });
        }
    }
}
