using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaProject.Model
{
    public class CinemaModel
    {
        private readonly CinemaDbContext _context;

        public CinemaModel(CinemaDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<MovieDto>> GetAllMovies()
        {
            return await _context.movies
                .Include(x => x.Image)
                .Include(x => x.FilmScreenings)
                .Select(x => new MovieDto
                {
                    MovieId = x.MovieId,
                    MovieTitle = x.MovieTitle,
                    Duration = x.Duration,
                    Genre = x.Genre,
                    Director = x.Director,
                    Description = x.Description,
                    ImageId = x.Image.ImageId,
                    Status = x.Status,
                    Screenings = x.FilmScreenings.Select(y => new FilmScreeningDto
                    {
                        FilmScreeningId = y.FilmScreeningId,
                        MovieId = y.MovieId,
                        MovieTitle = x.MovieTitle,
                        RoomId = y.RoomId,
                        Date = y.Date
                    }).ToList()
                }).ToListAsync();
        }

        public async Task<IEnumerable<FilmScreeningDto>> GetAllScreenings()
        {
            return await _context.filmScreenings.Include(x=> x.Movie).Select(x => new FilmScreeningDto
            {
                FilmScreeningId = x.FilmScreeningId,
                MovieId = x.MovieId,
                MovieTitle = x.Movie.MovieTitle,
                RoomId = x.RoomId,
                Date = x.Date
            }).ToListAsync();
        }

        public async Task<IEnumerable<RoomDto>> GetAllRooms()
        {
            return await _context.rooms.Select(x => new RoomDto
            {
                RoomId = x.RoomId,
                RoomName = x.RoomName
            }).ToListAsync();
        }

        public async Task<IEnumerable<TicketTypeDto>> GetAllTicketType()
        {
            return await _context.ticketTypes.Select(x => new TicketTypeDto
            {
                TicketTypeId = x.TicketTypeId,
                TicketType = x.TicketType,
                TicketPrice = x.TicketPrice
            }).ToListAsync();
        }

        public async Task<IEnumerable<CategoriesDto>> GetAllCategories()
        {
            return await _context.categoriesForHTML.Select(x => new CategoriesDto
            {
                CategId = x.CategoryId,
                Name = x.CategoryName,
                Description = x.CategoryDescription
            }).ToListAsync();
        }

        public async Task<IEnumerable<MovieDto>> SearchMovieByTitle(string item)
        {
            item = item.ToLower();

            return await _context.movies
                .Include(x => x.Image)
                .Include(x => x.FilmScreenings).Where(x => x.MovieTitle.ToLower().Contains(item))
                .Select(x => new MovieDto
                {
                    MovieId = x.MovieId,
                    MovieTitle = x.MovieTitle,
                    Duration = x.Duration,
                    Genre = x.Genre,
                    Director = x.Director,
                    Description = x.Description,
                    ImageId = x.Image.ImageId,
                    Status = x.Status,
                    Screenings = x.FilmScreenings.Select(y => new FilmScreeningDto
                    {
                        FilmScreeningId = y.FilmScreeningId,
                        MovieId = y.MovieId,
                        MovieTitle = x.MovieTitle,
                        RoomId = y.RoomId,
                        Date = y.Date
                    }).ToList()
                }).ToListAsync();
        }

        public async Task<IEnumerable<MovieDto>> SearchMovieByGenre(string item)
        {
            item = item.ToLower();

            return await _context.movies
                .Include(x => x.Image)
                .Include(x => x.FilmScreenings).Where(x => x.Genre.ToLower().Contains(item))
                .Select(x => new MovieDto
                {
                    MovieId = x.MovieId,
                    MovieTitle = x.MovieTitle,
                    Duration = x.Duration,
                    Genre = x.Genre,
                    Director = x.Director,
                    Description = x.Description,
                    ImageId = x.Image.ImageId,
                    Status = x.Status,
                    Screenings = x.FilmScreenings.Select(y => new FilmScreeningDto
                    {
                        FilmScreeningId = y.FilmScreeningId,
                        MovieId = y.MovieId,
                        MovieTitle = x.MovieTitle,
                        RoomId = y.RoomId,
                        Date = y.Date
                    }).ToList()
                }).ToListAsync();
        }

        public async Task<IEnumerable<MovieDto>> SearchMovieByDirector(string item)
        {
            item = item.ToLower();

            return await _context.movies
                .Include(x => x.Image)
                .Include(x => x.FilmScreenings).Where(x => x.Director.ToLower().Contains(item))
                .Select(x => new MovieDto
                {
                    MovieId = x.MovieId,
                    MovieTitle = x.MovieTitle,
                    Duration = x.Duration,
                    Genre = x.Genre,
                    Director = x.Director,
                    Description = x.Description,
                    ImageId = x.Image.ImageId,
                    Status = x.Status,
                    Screenings = x.FilmScreenings.Select(y => new FilmScreeningDto
                    {
                        FilmScreeningId = y.FilmScreeningId,
                        MovieId = y.MovieId,
                        MovieTitle = x.MovieTitle,
                        RoomId = y.RoomId,
                        Date = y.Date
                    }).ToList()
                }).ToListAsync();
        }

        public async Task<IEnumerable<FilmScreeningDto>> GetScreeningDetails(DateTimeOffset time)
        {
            return await _context.filmScreenings.Include(x=> x.Movie).Where(x => x.Date == time)
                .Select(x => new FilmScreeningDto
                {
                    FilmScreeningId = x.FilmScreeningId,
                    MovieId = x.MovieId,
                    MovieTitle = x.Movie.MovieTitle,
                    RoomId = x.RoomId,
                    Date = x.Date
                }).ToListAsync();
        }

        public async Task<List<FilmScreeningDto>> GetUpcomingScreenings()
        {
            var nowUtc = DateTimeOffset.UtcNow;

            return await _context.filmScreenings.Include(x=> x.Movie).Where(x => x.Date >= nowUtc).Where(x => _context.movies.Any(m => m.MovieId == x.MovieId && m.Status == MovieStatus.NowRunning))
                .Select(x => new FilmScreeningDto
                {
                    FilmScreeningId = x.FilmScreeningId,
                    MovieId = x.MovieId,
                    MovieTitle = x.Movie.MovieTitle,
                    RoomId = x.RoomId,
                    Date = x.Date
                }).ToListAsync();
        }

        public async Task<bool> IsMovieNowRunning(string movieTitle)
        {
            movieTitle = movieTitle.ToLower();

            var movie = await _context.movies.FirstOrDefaultAsync(x => x.MovieTitle.ToLower() == movieTitle);

            return movie != null && movie.Status == MovieStatus.NowRunning;
        }

        public async Task<int> GetRoomCapacity(int roomId)
        {
            var room = await _context.rooms.Include(x => x.Seats).FirstOrDefaultAsync(x => x.RoomId == roomId);

            if (room == null)
                throw new InvalidOperationException("Room not found");

            return room.Seats.Count;
        }

        public async Task<List<SeatDto>> GetSeats(int roomId, int screeningId)
        {
            var reservedSeatIds = await _context.seats.Where(s => s.CartId != null && s.Cart != null && s.Cart.FilmScreeningId == screeningId).Select(s => s.SeatId).ToListAsync();

            return await _context.seats.Where(x => x.RoomId == roomId).Select(x => new SeatDto
            {
                SeatId = x.SeatId,
                RowNumber = x.RowNumber,
                SeatNumber = x.SeatNumber,
                RoomId = x.RoomId,
                IsReserved = reservedSeatIds.Contains(x.SeatId)
            }).ToListAsync();
        }

        public async Task<bool> IsSeatAvailable(int seatId, int screeningId)
        {
            var reserved = await _context.carts.AnyAsync(x => x.FilmScreeningId == screeningId && x.Seats.Any(s => s.SeatId == seatId));

            return !reserved;
        }

        public async Task<bool> HasFreeSeats(int screeningId, int requiredSeats)
        {
            var screening = await _context.filmScreenings
                .Include(x => x.Room)
                    .ThenInclude(x => x.Seats).FirstOrDefaultAsync(x => x.FilmScreeningId == screeningId);

            if (screening == null)
                throw new InvalidOperationException("Screening not found");

            var reservedSeatIds = await _context.carts.Where(x => x.FilmScreeningId == screeningId).SelectMany(x => x.Seats.Select(s => s.SeatId)).ToListAsync();

            var freeSeatsCount = screening.Room.Seats.Count(x => !reservedSeatIds.Contains(x.SeatId));

            return freeSeatsCount >= requiredSeats;
        }

        public async Task<TicketTypeDto?> SelectTicketType()
        {
            return await _context.ticketTypes
                .Select(x => new TicketTypeDto
                {
                    TicketTypeId = x.TicketTypeId,
                    TicketType = x.TicketType,
                    TicketPrice = x.TicketPrice
                }).FirstOrDefaultAsync();
        }

        public async Task SetQuantity(int cartId, int amount)
        {
            var cart = await _context.carts.Include(x => x.Ticket).FirstOrDefaultAsync(x => x.CartId == cartId);

            if (cart == null)
                throw new InvalidOperationException("Cart not found");

            if (amount <= 0)
                throw new ArgumentException("Quantity must be greater than zero");

            cart.Amount = amount;
            cart.TotalPrice = cart.Ticket.TicketType.TicketPrice * amount;

            await _context.SaveChangesAsync();
        }

        public async Task<ImageDto?> GetImage(int movieId)
        {
            return await _context.movies.Include(x => x.Image).Where(x => x.MovieId == movieId)
                .Select(x => new ImageDto
                {
                    ImageId = x.Image.ImageId,
                    ImageContent = x.Image.ImageContent
                }).FirstOrDefaultAsync();
        }
    }
}