using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CinemaProject.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketTypesRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ticketsForHTML");

            migrationBuilder.DropColumn(
                name: "TicketType",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "MovieTitle",
                table: "filmScreenings");

            migrationBuilder.RenameColumn(
                name: "TicketPrice",
                table: "tickets",
                newName: "TicketTypesTicketTypeId");

            migrationBuilder.AddColumn<int>(
                name: "TicketTypeId",
                table: "tickets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ticketTypes",
                columns: table => new
                {
                    TicketTypeId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TicketType = table.Column<string>(type: "text", nullable: false),
                    TicketPrice = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ticketTypes", x => x.TicketTypeId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tickets_TicketTypesTicketTypeId",
                table: "tickets",
                column: "TicketTypesTicketTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_tickets_ticketTypes_TicketTypesTicketTypeId",
                table: "tickets",
                column: "TicketTypesTicketTypeId",
                principalTable: "ticketTypes",
                principalColumn: "TicketTypeId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tickets_ticketTypes_TicketTypesTicketTypeId",
                table: "tickets");

            migrationBuilder.DropTable(
                name: "ticketTypes");

            migrationBuilder.DropIndex(
                name: "IX_tickets_TicketTypesTicketTypeId",
                table: "tickets");

            migrationBuilder.DropColumn(
                name: "TicketTypeId",
                table: "tickets");

            migrationBuilder.RenameColumn(
                name: "TicketTypesTicketTypeId",
                table: "tickets",
                newName: "TicketPrice");

            migrationBuilder.AddColumn<string>(
                name: "TicketType",
                table: "tickets",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MovieTitle",
                table: "filmScreenings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ticketsForHTML",
                columns: table => new
                {
                    TicketId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TicketPrice = table.Column<int>(type: "integer", nullable: false),
                    TicketType = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ticketsForHTML", x => x.TicketId);
                });
        }
    }
}
