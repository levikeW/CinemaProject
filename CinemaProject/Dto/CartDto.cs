using CinemaProject.Persistence;

namespace Cinema.Dto
{
    public class CartDto
    {
        public int CartId { get; set; }
        public int UserId { get; set; }
        public int FilmScreeningId { get; set; }
        public int TicketId { get; set; }
        public int Amount { get; set; }
        public List<Seat> Seats { get; set; } = new List<Seat>();
    }
}
