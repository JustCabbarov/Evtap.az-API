using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EvTap.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SomeEntitiesChanged : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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
                    { "2280395f-2b6c-4966-bc41-91b9501035a0", null, "Admin", "ADMIN" },
                    { "4324c503-d7e9-4b64-8397-3ec01400b8cc", null, "Agency", "AGENCY" },
                    { "f8c166a6-0f01-487e-8723-940d4bbb8e0e", null, "User", "USER" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "2280395f-2b6c-4966-bc41-91b9501035a0");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "4324c503-d7e9-4b64-8397-3ec01400b8cc");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "f8c166a6-0f01-487e-8723-940d4bbb8e0e");

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
    }
}
