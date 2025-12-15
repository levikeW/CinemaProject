namespace CinemaProject.Dto
{
    public class ConfirmationDto
    {
        public int ReservationId { get; set; }
        public string MovieTitle { get; set; }
        public DateTime ScreeningDate { get; set; }
        public string RoomName { get; set; }
        public ICollection<string> Seats { get; set; } = new List<string>();
        public int TicketId { get; set; }
        public int Amount { get; set; }
        public int TotalPrice { get; set; }
        public string UserEmail { get; set; }
    }

}
