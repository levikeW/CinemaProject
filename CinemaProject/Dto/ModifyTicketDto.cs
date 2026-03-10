namespace CinemaProject.Dto
{
    public class ModifyTicketDto
    {
        public int TicketId { get; set; }
        public string TicketType { get; set; }
        public int TicketPrice { get; set; }
        public int FilmScreeningId { get; set; }
    }
}
