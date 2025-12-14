using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CinemaProject.Model
{
    public class UserModel
    {
        private readonly CinemaDbContext _context;
        public UserModel(CinemaDbContext context)
        {
            _context = context;
        }
        private string HashPass(string password)
        {
            using var Sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = Sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
        public void Regist(string email, string pass, string role = "User")
        {
            if (_context.users.Any(x => x.Email == email))
            {
                throw new InvalidOperationException("Already exixts");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                _context.users.Add(new User { Email = email, Password = HashPass(pass), Role = role });
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public User? ValidateUser(string email, string pass)
        {
            var hash = HashPass(pass);
            var user = _context.users.Where(x => x.Email == email);
            return user.Where(x => x.Password == hash).FirstOrDefault();
        }

        public IEnumerable<MovieDto> GetAllMovieInformation()
        {
            return _context.movies.Include(x => x.Image).Include(x => x.FilmScreenings).Select(x => new MovieDto
            {
                MovieId = x.MovieId,
                MovieTitle = x.MovieTitle,
                Duration = x.Duration,
                Genre = x.Genre,
                Director = x.Director,
                Description = x.Description,
                ImageId = x.Image.ImageId,
                Screenings = x.FilmScreenings.Select(y => new FilmScreeningDto
                {
                    FilmScreeningId = y.FilmScreeningId,
                    MovieId = y.MovieId,
                    RoomId = y.RoomId,
                    Date = y.Date
                }).ToList()
            }).ToList();
        }
        public IEnumerable<MovieDto> SearchMovie(string item)
        {
            return _context.movies.Include(x => x.Image).Include(x => x.FilmScreenings).Where(x => x.MovieTitle.ToLower().Contains(item.ToLower())).Select(x => new MovieDto
            {
                MovieId = x.MovieId,
                MovieTitle = x.MovieTitle,
                Duration = x.Duration,
                Genre = x.Genre,
                Director = x.Director,
                Description = x.Description,
                ImageId = x.Image.ImageId,
                Screenings = x.FilmScreenings.Select(y => new FilmScreeningDto
                {
                    FilmScreeningId = y.FilmScreeningId,
                    MovieId = y.MovieId,
                    RoomId = y.RoomId,
                    Date = y.Date
                }).ToList()
            }).ToList();
        }

        public IEnumerable<CartDto> GetCart(CartDto dto,int userId)
        {
            var seatIds = dto.Seats.Select(s => s.SeatId).ToList();
            var seats = _context.seats.Where(x => seatIds.Contains(x.SeatId)).ToList();
            return _context.carts.Include(x => x.FilmScreening).Include(x => x.Ticket).Where(x => x.UserId == userId).Select(x => new CartDto
            {
                CartId = x.CartId,
                FilmScreeningId = x.FilmScreeningId,
                Seats = seats,
                TicketId = x.TicketId,
                Amount = x.Amount
            }).ToList();
        }
      
    }
}
