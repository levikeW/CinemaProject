namespace Cinema.Dto
{
    public class SeatDto
    {
        public int SeatId { get; set; }
        public int RowNumber { get; set; }
        public int SeatNumber { get; set; }
        public int RoomId { get; set; } 
        public bool IsReserved { get; set; } = false;
    }
}
