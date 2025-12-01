namespace Cinema.Dto
{
    public class CartDto
    {
        public int CartId { get; set; }
        public int UserId { get; set; }
        public int FilmScreeningId { get; set; }
        public int SeatId { get; set; }
        public int Amount { get; set; }
    }
}
