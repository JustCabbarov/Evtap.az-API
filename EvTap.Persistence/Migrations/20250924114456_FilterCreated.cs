using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EvTap.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FilterCreated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.CreateTable(
                name: "ListingFilters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DistrictIds = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AdvertType = table.Column<int>(type: "int", nullable: true),
                    CategoryIds = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PriceMin = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PriceMax = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Rooms = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Renovation = table.Column<int>(type: "int", nullable: true),
                    AreaMin = table.Column<double>(type: "float", nullable: true),
                    AreaMax = table.Column<double>(type: "float", nullable: true),
                    FloorMin = table.Column<int>(type: "int", nullable: true),
                    FloorMax = table.Column<int>(type: "int", nullable: true),
                    FloorFilterType = table.Column<int>(type: "int", nullable: true),
                    CreatorType = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListingFilters", x => x.Id);
                });

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ListingFilters");

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
    }
}
