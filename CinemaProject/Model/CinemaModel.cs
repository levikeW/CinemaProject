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

        // Összes film lekérése vetítésekkel együtt
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

        // Összes vetítés lekérése
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

        // Összes terem lekérése
        public async Task<IEnumerable<RoomDto>> GetAllRooms()
        {
            return await _context.rooms.Select(x => new RoomDto
            {
                RoomId = x.RoomId,
                RoomName = x.RoomName
            }).ToListAsync();
        }

        // Összes jegytípus lekérése

        public async Task<IEnumerable<TicketTypeDto>> GetAllTicketType()
        {
            return await _context.ticketTypes.Select(x => new TicketTypeDto
            {
                TicketTypeId = x.TicketTypeId,
                TicketType = x.TicketType,
                TicketPrice = x.TicketPrice
            }).ToListAsync();
        }

        // Összes kategória lekérése
        public async Task<IEnumerable<CategoriesDto>> GetAllCategories()
        {
            return await _context.categoriesForHTML.Select(x => new CategoriesDto
            {
                CategId = x.CategoryId,
                Name = x.CategoryName,
                Description = x.CategoryDescription
            }).ToListAsync();
        }

        // Film keresése cím alapján
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

        // Film keresése műfaj alapján
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

        // Film keresése rendező alapján
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

        // Vetítések lekérése adott időpont alapján
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

        // Közelgő, aktuálisan futó filmek vetítéseinek lekérése
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

        // Megnézi, hogy a film jelenleg fut-e
        public async Task<bool> IsMovieNowRunning(string movieTitle)
        {
            movieTitle = movieTitle.ToLower();

            var movie = await _context.movies.FirstOrDefaultAsync(x => x.MovieTitle.ToLower() == movieTitle);

            return movie != null && movie.Status == MovieStatus.NowRunning;
        }

        // Terem kapacitásának lekérése
        public async Task<int> GetRoomCapacity(int roomId)
        {
            var room = await _context.rooms.Include(x => x.Seats).FirstOrDefaultAsync(x => x.RoomId == roomId);

            if (room == null)
                throw new KeyNotFoundException("Room not found");

            return room.Seats.Count;
        }

        // Székek lekérése foglaltsági állapottal együtt
        public async Task<List<SeatDto>> GetSeats(int roomId, int screeningId)
        {
            // Már lefoglalt székek kigyűjtése az adott vetítéshez
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

        // Megnézi, hogy az adott szék szabad-e az adott vetítésen
        public async Task<bool> IsSeatAvailable(int seatId, int screeningId)
        {
            var reserved = await _context.carts.AnyAsync(x => x.FilmScreeningId == screeningId && x.Seats.Any(s => s.SeatId == seatId));

            return !reserved;
        }

        // Megnézi, hogy van-e elég szabad hely az adott vetítésen
        public async Task<bool> HasFreeSeats(int screeningId, int requiredSeats)
        {
            var screening = await _context.filmScreenings
                .Include(x => x.Room)
                    .ThenInclude(x => x.Seats).FirstOrDefaultAsync(x => x.FilmScreeningId == screeningId);

            if (screening == null)
                throw new KeyNotFoundException("Screening not found");

            var reservedSeatIds = await _context.carts.Where(x => x.FilmScreeningId == screeningId).SelectMany(x => x.Seats.Select(s => s.SeatId)).ToListAsync();

            var freeSeatsCount = screening.Room.Seats.Count(x => !reservedSeatIds.Contains(x.SeatId));

            return freeSeatsCount >= requiredSeats;
        }

        // TicketId számláló helyreállítása, hogy ne legyen ID ütközés
        public void EnsureTicketsExist()
        {
            if (string.Equals(_context.Database.ProviderName, "Npgsql.EntityFrameworkCore.PostgreSQL", StringComparison.Ordinal))
            {
                _context.Database.ExecuteSqlRaw(@"
            SELECT setval(
                pg_get_serial_sequence('""tickets""', 'TicketId'),
                COALESCE((SELECT MAX(""TicketId"") FROM ""tickets""), 0) + 1,
                false
            );
        ");
            }
            var screenings = _context.filmScreenings.Include(x => x.Room).ToList();

            var ticketTypes = _context.ticketTypes.ToList();

            foreach (var screening in screenings)
            {
                bool roomIsVip = IsVip(screening.Room?.RoomName ?? screening.RoomName);

                foreach (var ticketType in ticketTypes)
                {
                    bool ticketIsVip = IsVip(ticketType.TicketType);

                    if (roomIsVip != ticketIsVip)
                        continue;

                    bool exists = _context.tickets.Any(x =>
                        x.FilmScreeningId == screening.FilmScreeningId &&
                        x.TicketTypeId == ticketType.TicketTypeId);

                    if (!exists)
                    {
                        _context.tickets.Add(new Ticket
                        {
                            FilmScreeningId = screening.FilmScreeningId,
                            TicketTypeId = ticketType.TicketTypeId
                        });
                    }
                }
            }

            _context.SaveChanges();
        }

        // Megnézi, hogy a szöveg VIP típust jelöl-e
        private bool IsVip(string? text)
        {
            return !string.IsNullOrWhiteSpace(text) && text.ToLower().Contains("vip");
        }

        // Ticketek lekérése vetítés alapján
        public async Task<List<TicketDto>> GetTicketsByScreening(int screeningId)
        {
            return await _context.tickets.Where(x => x.FilmScreeningId == screeningId)
                .Select(x => new TicketDto
                {
                    TicketId = x.TicketId,
                    TicketTypeId = x.TicketTypeId,
                    FilmScreeningId = x.FilmScreeningId ?? 0
                }).ToListAsync();
        }

        // Kosárban lévő jegyek darabszámának módosítása
        public async Task SetQuantity(int cartId, int amount)
        {
            var cart = await _context.carts.Include(x => x.Ticket).FirstOrDefaultAsync(x => x.CartId == cartId);

            if (cart == null)
                throw new KeyNotFoundException("Cart not found");

            if (amount <= 0)
                throw new InvalidDataException("Quantity must be greater than zero");

            cart.Amount = amount;
            cart.TotalPrice = cart.Ticket.TicketType.TicketPrice * amount;

            await _context.SaveChangesAsync();
        }

        // Film képének lekérése
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