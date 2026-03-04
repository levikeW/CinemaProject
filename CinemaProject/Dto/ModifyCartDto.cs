using Cinema.Dto;

namespace CinemaProject.Dto
{
    public class ModifyCartDto
    {
        public int CartId { get; set; }
        public int NewAmount { get; set; }
        public List<int> NewSeatIds { get; set; } = new List<int>();
    }
}
