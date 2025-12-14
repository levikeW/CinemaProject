using CinemaProject.Persistence;

namespace Cinema.Dto
{
    public class RoomDto
    {
        public int RoomId { get; set; }
        public string RoomName { get; set; }
        public List<Seat> Seats { get; set; } = new List<Seat>();
    }
}
