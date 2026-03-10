using CinemaProject.Persistence;

namespace CinemaProject.Dto
{
    public class ModifyMovieDto
    {
        public int MovieId { get; set; } 
        public string MovieTitle { get; set; }
        public int Duration { get; set; }
        public string Genre { get; set; }
        public string Director { get; set; }
        public string Description { get; set; }
        public int ImageId { get; set; }
        public MovieStatus Status { get; set; }
    }
}
