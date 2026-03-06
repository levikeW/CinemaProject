namespace CinemaProject.Dto
{
    public class NewScreeningDto
    {
        public int FilmScreeningId { get; set; }
        public int MovieId { get; set; }
        public string MovieTitle { get; set; }
        public int RoomId { get; set; }
        public string RoomName { get; set; }
        public DateTimeOffset Date { get; set; }
    }
}
