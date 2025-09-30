using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EvTap.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ListingImages_Listings_ListingId",
                table: "ListingImages");

            migrationBuilder.AlterColumn<string>(
                name: "ReceiverId",
                table: "Messages",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<int>(
                name: "ListingId",
                table: "Messages",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ListingId",
                table: "ListingImages",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

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
                name: "IX_Messages_ListingId",
                table: "Messages",
                column: "ListingId");

            migrationBuilder.AddForeignKey(
                name: "FK_ListingImages_Listings_ListingId",
                table: "ListingImages",
                column: "ListingId",
                principalTable: "Listings",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Listings_ListingId",
                table: "Messages",
                column: "ListingId",
                principalTable: "Listings",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ListingImages_Listings_ListingId",
                table: "ListingImages");

            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Listings_ListingId",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_ListingId",
                table: "Messages");

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
                name: "ListingId",
                table: "Messages");

            migrationBuilder.AlterColumn<string>(
                name: "ReceiverId",
                table: "Messages",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ListingId",
                table: "ListingImages",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ListingImages_Listings_ListingId",
                table: "ListingImages",
                column: "ListingId",
                principalTable: "Listings",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
