using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EvTap.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SomeEntitiesFixed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Listings_AspNetUsers_UserId1",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_UserId1",
                table: "Listings");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "2d7f017e-4179-4aab-9206-f4ae43c343a0");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "8ffd3f2e-5609-478f-aeeb-55c9939d5b73");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "adeda042-28e0-443a-897f-c15967e5217f");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "Listings");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "Listings",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "04d09b45-e31d-40ae-b39d-89762bcbd38e", null, "User", "USER" },
                    { "87647733-315a-4cb9-8355-4b73d6897a0b", null, "Agency", "AGENCY" },
                    { "b7bec298-7714-4da2-b4ae-7bc1b8c32a6c", null, "Admin", "ADMIN" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Listings_UserId",
                table: "Listings",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_AspNetUsers_UserId",
                table: "Listings",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Listings_AspNetUsers_UserId",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_UserId",
                table: "Listings");

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

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Listings",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<string>(
                name: "UserId1",
                table: "Listings",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[,]
                {
                    { "2d7f017e-4179-4aab-9206-f4ae43c343a0", null, "Admin", "ADMIN" },
                    { "8ffd3f2e-5609-478f-aeeb-55c9939d5b73", null, "User", "USER" },
                    { "adeda042-28e0-443a-897f-c15967e5217f", null, "Agency", "AGENCY" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Listings_UserId1",
                table: "Listings",
                column: "UserId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_AspNetUsers_UserId1",
                table: "Listings",
                column: "UserId1",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
