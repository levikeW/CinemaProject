using CinemaProject.Persistence;

namespace CinemaProject.Dto
{
    public class ModifyRoomDto
    {
        public int RoomId { get; set; }
        public string RoomName { get; set; }
        public List<Seat> Seats { get; set; } = new List<Seat>();
    }
}
