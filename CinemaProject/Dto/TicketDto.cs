using CinemaProject.Persistence;

namespace Cinema.Dto
{
    public class TicketDto
    {
        public int TicketId { get; set; }
        public int TicketTypeId { get; set; }
        public int FilmScreeningId { get; set; }
    }
}
