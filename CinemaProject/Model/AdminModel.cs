using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaProject.Model
{
    public class AdminModel
    {
        private readonly CinemaDbContext _context;
        public AdminModel(CinemaDbContext context)
        {
            _context = context;
        }
        public IEnumerable<UserDto> GetAllUsers()
        {
            return _context.users.Select(x => new UserDto
            {
                UserId = x.UserId,
                Email = x.Email,
                FullName = x.FullName,
            }).ToList();
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
        public IEnumerable<UserDto> SearchUser(string item)
        {
            return _context.users.Where(x => x.Email.ToLower().Contains(item.ToLower()) ||
            x.FullName.ToLower().Contains(item.ToLower()))
                .Select(x => new UserDto
                {
                    UserId = x.UserId,
                    Email = x.Email,
                    FullName = x.FullName,
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

        public void NewMovie(NewMovieDto dto)
        {
            if (_context.movies.Any(x => x.MovieTitle == dto.MovieTitle))
            {
                throw new InvalidOperationException("Already exists");
            }

            int imageId = _context.images.Where(x => x.ImageId == dto.ImageId).First().ImageId;
            using var trx = _context.Database.BeginTransaction();
            {
                _context.movies.Add(new Persistence.Movie
                {
                    MovieTitle = dto.MovieTitle,
                    Duration = dto.Duration,
                    Genre = dto.Genre,
                    Director = dto.Director,
                    Description = dto.Description,
                    ImageId = imageId
                });
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void ModifyMovie(MovieDto dto, int movieId)
        {
            var movie = _context.movies.First(x => x.MovieId == movieId);
            if (movie == null)
            {
                throw new InvalidOperationException("Movie not found");
            }
            int imageId = _context.images.Where(x => x.ImageId == dto.ImageId).First().ImageId;
            using var trx = _context.Database.BeginTransaction();
            {
                movie.MovieTitle = dto.MovieTitle;
                movie.Duration = dto.Duration;
                movie.Genre = dto.Genre;
                movie.Director = dto.Director;
                movie.Description = dto.Description;
                movie.ImageId = imageId;
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void ModifyFilmScreening(FilmScreeningDto dto, int screeningId)
        {
            var screening = _context.filmScreenings.First(x => x.FilmScreeningId == screeningId);
            if (screening == null)
            {
                throw new InvalidOperationException("Screening not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                screening.MovieId = dto.MovieId;
                screening.RoomId = dto.RoomId;
                screening.Date = dto.Date;
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void ModifyReservation(PaymentReservationDto dto, int reservationId)
        {
            var reservation = _context.paymentReservations.Include(x => x.Cart).FirstOrDefault(x => x.PaymentReservationId == reservationId);
            if (reservation == null)
            {
                throw new InvalidOperationException("Reservation not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                var seatIds = dto.Seats.Select(s => s.SeatId).ToList();
                var seats = _context.seats.Where(x => seatIds.Contains(x.SeatId)).ToList();
                reservation.Date = dto.Date;
                reservation.IsPaid = dto.IsPaid;
                if (reservation.Cart != null)
                {
                    reservation.Cart.Seats = seats;
                    reservation.Cart.FilmScreeningId = dto.FilmScreeningId;
                    reservation.Cart.Amount = dto.Amount;
                    reservation.Cart.UserId = dto.UserId;
                }
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void ModifyTicket(TicketDto dto, int ticketId)
        {
            var ticket = _context.tickets.First(x => x.TicketId == ticketId);
            if (ticket == null)
            {
                throw new InvalidOperationException("TicketType not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                ticket.TicketPrice = dto.TicketPrice;
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void DeleteUser(int userId)
        {
            if (!_context.users.Any(x => x.UserId == userId))
            {
                throw new InvalidOperationException("User not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                _context.users.Remove(_context.users.Where(x => x.UserId == userId).First());
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void DeleteMovie(int movieId)
        {
            if (!_context.movies.Any(x => x.MovieId == movieId))
            {
                throw new InvalidOperationException("Movie not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                _context.movies.Remove(_context.movies.Where(x => x.MovieId == movieId).First());
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void DeleteReservation(int reservationId)
        {
            if (!_context.paymentReservations.Any(x => x.PaymentReservationId == reservationId))
            {
                throw new InvalidOperationException("Reservation not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                _context.paymentReservations.Remove(_context.paymentReservations.Where(x => x.PaymentReservationId == reservationId).First());
                _context.SaveChanges();
                trx.Commit();
            }
        }
    }
}
