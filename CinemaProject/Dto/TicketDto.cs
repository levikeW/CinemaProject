using CinemaProject.Persistence;

namespace Cinema.Dto
{
    public class TicketDto
    {
        public int TicketId { get; set; }
        public string TicketType { get; set; }
        public int TicketPrice { get; set; }
        public int FilmScreeningId { get; set; }
    }
}
