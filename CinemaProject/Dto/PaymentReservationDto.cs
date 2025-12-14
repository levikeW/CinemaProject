using CinemaProject.Persistence;

namespace CinemaProject.Dto
{
    public class PaymentReservationDto
    {
        public int PaymentReservationId { get; set; }
        public int CartId { get; set; }
        public DateTime Date { get; set; }
        public bool IsPaid { get; set; }
        public int FilmScreeningId { get; set; }
        public int Amount { get; set; }
        public int UserId { get; set; }
        public List<Seat> Seats { get; set; } = new List<Seat>();
    }
}
