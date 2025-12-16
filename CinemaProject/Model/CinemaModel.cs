using Cinema.Dto;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace CinemaProject.Model
{
    public class CinemaModel
    {
        private readonly CinemaDbContext _context;
        public CinemaModel(CinemaDbContext context)
        {
            _context = context;
        }
        public IEnumerable<MovieDto> GetAllMovies()
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

        public IEnumerable<FilmScreeningDto> GetAllScreenings()
        {
            return _context.filmScreenings.Select(x => new FilmScreeningDto
            {
                FilmScreeningId = x.FilmScreeningId,
                MovieId = x.MovieId,
                RoomId = x.RoomId,
                Date = x.Date
            }).ToList();
        }

        public IEnumerable<TicketDto> GetAllTickets()
        {
            return _context.tickets.Select(x => new TicketDto
            {
                TicketId = x.TicketId,
                TicketType = x.TicketType,
                TicketPrice = x.TicketPrice,
                FilmScreeningId = x.FilmScreeningId
            }).ToList();
        }

        public IEnumerable<MovieDto> SearchMovieByTitle(string item)
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

        public IEnumerable<MovieDto> SearchMovieByGenre(string item)
        {
            return _context.movies.Include(x => x.Image).Include(x => x.FilmScreenings).Where(x => x.Genre.ToLower().Contains(item.ToLower())).Select(x => new MovieDto
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

        public IEnumerable<MovieDto> SearchMovieByDirector(string item)
        {
            return _context.movies.Include(x => x.Image).Include(x => x.FilmScreenings).Where(x => x.Director.ToLower().Contains(item.ToLower())).Select(x => new MovieDto
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

        public IEnumerable<FilmScreeningDto> GetScreeningDetails(DateTime time)
        {
            return _context.filmScreenings.Include(x => x.Movie).Where(x => x.Date == time).Select(x => new FilmScreeningDto
            {
                FilmScreeningId = x.FilmScreeningId,
                MovieId = x.MovieId,
                RoomId = x.RoomId,
                Date = x.Date,
                Movie = new MovieDto
                {
                    MovieId = x.Movie.MovieId,
                    MovieTitle = x.Movie.MovieTitle,
                    Duration = x.Movie.Duration,
                    Genre = x.Movie.Genre,
                    Director = x.Movie.Director,
                    Description = x.Movie.Description,
                    ImageId = x.Movie.Image.ImageId
                }
            }).ToList();
        }

        public List<FilmScreeningDto> GetUpcomingScreenings()
        {
            var now = DateTime.UtcNow;
            return _context.filmScreenings.Where(x => x.Date >= now && x.Movie.Status == MovieStatus.NowRunning).Select(x => new FilmScreeningDto
            {
                FilmScreeningId = x.FilmScreeningId,
                MovieId = x.MovieId,
                RoomId = x.RoomId,
                Date = x.Date
            }).ToList();
        }

        public bool IsMovieNowRunning(string movieTitle)
        {
            var movie = _context.movies.FirstOrDefault(x => x.MovieTitle.ToLower() == movieTitle.ToLower());
            if (movie != null)
            {
                return movie.Status == MovieStatus.NowRunning;
            }
            return false;
        }

        public int GetRoomCapacity(int roomId)
        {
            var room = _context.rooms.Include(x => x.Seats).FirstOrDefault(x => x.RoomId == roomId);
            if (room != null)
            {
                return room.Seats.Count;
            }
            else
            {
                throw new InvalidOperationException("Room not found");
            }
        }

        public List<SeatDto> GetSeats(int roomId, int screeningId)
        {
            var reservedSeatIds = _context.carts.Where(x => x.FilmScreeningId == screeningId).SelectMany(x => x.Seats.Select(x => x.SeatId)).ToList();
            return _context.seats.Where(x => x.RoomId == roomId).Select(x => new SeatDto
            {
                SeatId = x.SeatId,
                RowNumber = x.RowNumber,
                SeatNumber = x.SeatNumber,
                IsReserved = reservedSeatIds.Contains(x.SeatId)
            }).ToList();
        }

        public bool IsSeatAvailable(int seatId, int screeningId)
        {
            var reserved = _context.carts.Any(x => x.FilmScreeningId == screeningId && x.Seats.Any(x => x.SeatId == seatId));
            return !reserved;
        }

        public bool HasFreeSeats(int screeningId, int requiredSeats)
        {
            var screening = _context.filmScreenings.Include(x => x.Room).ThenInclude(x => x.Seats).FirstOrDefault(x => x.FilmScreeningId == screeningId);
            if (screening == null)
            {
                throw new InvalidOperationException("Screening not found");
            }
            var reservedSeatIds = _context.carts.Where(x => x.FilmScreeningId == screeningId).SelectMany(x => x.Seats.Select(x => x.SeatId)).ToList();
            var freeSeatsCount = screening.Room.Seats.Count(x => !reservedSeatIds.Contains(x.SeatId));

            return freeSeatsCount >= requiredSeats;
        }

        public TicketDto? SelectTicketType(int screeningId)
        {
            return _context.tickets.Where(x => x.FilmScreeningId == screeningId).Select(x => new TicketDto
            {
                TicketId = x.TicketId,
                TicketType = x.TicketType,
                TicketPrice = x.TicketPrice,
                FilmScreeningId = x.FilmScreeningId,
            }).FirstOrDefault();
        }

        public void SetQuantity(int cartId, int amount)
        {
            var cart = _context.carts.Include(x => x.Ticket).FirstOrDefault(x => x.CartId == cartId);

            if (cart == null)
                throw new InvalidOperationException("Cart not found");

            if (amount <= 0)
                throw new ArgumentException("Quantity must be greater than zero");

            cart.Amount = amount;

            var ticketPrice = cart.Ticket.TicketPrice;
            var totalPrice = ticketPrice * amount;

            cart.TotalPrice = totalPrice;
            _context.SaveChanges();
        }

        public ImageDto? GetImage(int movieId)
        {
            return _context.movies.Include(x => x.Image).Where(x => x.MovieId == movieId).Select(x => new ImageDto
            {
                ImageId = x.Image.ImageId,
                ImageContent = x.Image.ImageContent
            }).FirstOrDefault();
        }
    }
}
