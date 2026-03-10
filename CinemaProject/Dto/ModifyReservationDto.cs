using Cinema.Dto;
using CinemaProject.Persistence;

namespace CinemaProject.Dto
{
    public class ModifyReservationDto
    {
        public int PaymentReservationId { get; set; }
        public int CartId { get; set; }
        public DateTimeOffset Date { get; set; }
        public bool IsPaid { get; set; }
        public int FilmScreeningId { get; set; }
        public int Amount { get; set; }
        public int Price { get; set; }
        public int UserId { get; set; }
        public List<SeatDto> Seats { get; set; } = new();
    }
}
