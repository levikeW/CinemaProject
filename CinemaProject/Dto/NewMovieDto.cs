using Cinema.Dto;
using CinemaProject.Persistence;

namespace CinemaProject.Dto
{
    public class NewMovieDto
    {
        public int MovieId { get; set; }
        public string MovieTitle { get; set; }
        public int Duration { get; set; }
        public string Genre { get; set; }
        public string Director { get; set; }
        public string Description { get; set; }
        public int RoomId { get; set; }
        public int ImageId { get; set; }
        public MovieStatus Status { get; set; }
    }
}
