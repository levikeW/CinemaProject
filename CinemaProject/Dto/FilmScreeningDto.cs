namespace Cinema.Dto
{
    public class FilmScreeningDto
    {
        public int FilmScreeningId { get; set; }
        public int MovieId { get; set; }
        public int RoomId { get; set; }
        public DateTime Date { get; set; }
    }
}
