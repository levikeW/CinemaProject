using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CinemaProject_Avalonia.Models
{
    public class Movie
    {
        public string Title { get; set; }
        public string ImagePath { get; set; }
        public string AgeRating { get; set; }
        public List<string> Screenings { get; set; }
        public string Category { get; set; }
    }
}
