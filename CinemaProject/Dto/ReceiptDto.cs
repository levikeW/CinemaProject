using CinemaProject.Persistence;

namespace CinemaProject.Dto
{
    public class ReceiptDto
    {
        public int ReceiptId { get; set; }
        public int PaymentReservationId { get; set; }
        public string MovieTitle { get; set; }
        public DateTime ScreeningDate { get; set; }
        public string RoomName { get; set; }
        public int TicketId { get; set; }
        public int Amount { get; set; }
        public decimal TotalPrice { get; set; }
        public DateTime PaymentDate { get; set; }
        public string UserEmail { get; set; }
        public ICollection<string> Seats { get; set; } = new List<string>();
    }
}
