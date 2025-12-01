namespace Cinema.Dto
{
    public class PaymentReservationDto
    {
        public int PaymentReservationId { get; set; }
        public int CartId { get; set; }
        public DateTime Date { get; set; }
        public bool IsPaid { get; set; }
    }
}
