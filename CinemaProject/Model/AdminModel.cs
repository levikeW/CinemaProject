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

        // Összes felhasználó lekérése
        public async Task<IEnumerable<UserDto>> GetAllUsers()
        {
            return await _context.users
                .Select(x => new UserDto
                {
                    UserId = x.UserId,
                    Email = x.Email,
                    FullName = x.FullName,
                    Role = x.Role
                }).ToListAsync();
        }

        // Összes foglalás lekérése
        public async Task<IEnumerable<PaymentReservationDto>> GetAllReservations()
        {
            return await _context.paymentReservations
                .Select(x => new PaymentReservationDto
                {
                    PaymentReservationId = x.PaymentReservationId,
                    CartId = x.CartId,
                    Date = x.Date,
                    IsPaid = x.IsPaid,
                    FilmScreeningId = x.FilmScreeningId,
                    UserId = x.UserId,
                    Amount = x.Cart.Amount,
                    Price = x.Cart.Ticket.TicketType.TicketPrice * x.Cart.Amount,
                    Seats = x.Cart.Seats.Select(x => new SeatDto
                    {
                        SeatId = x.SeatId,
                        RowNumber = x.RowNumber,
                        SeatNumber = x.SeatNumber,
                        RoomId = x.RoomId,
                        IsReserved = x.IsReserved
                    }).ToList()
                }).ToListAsync();
        }

        // Felhasználó keresése email vagy név alapján
        public async Task<IEnumerable<UserDto>> SearchUser(string item)
        {
            item = item.ToLower();

            return await _context.users.Where(x => x.Email.ToLower().Contains(item) || x.FullName.ToLower().Contains(item)).Select(x => new UserDto
            {
                UserId = x.UserId,
                Email = x.Email,
                FullName = x.FullName,
                Role = x.Role
            }).ToListAsync();
        }

        // Új film létrehozása
        public async Task<NewMovieDto> NewMovie(NewMovieDto dto)
        {
            if (await _context.movies.AnyAsync(x => x.MovieTitle == dto.MovieTitle))
                throw new InvalidOperationException("Already exists");

            var imageId = await _context.images.Where(x => x.ImageId == dto.ImageId).Select(x => x.ImageId).FirstOrDefaultAsync();

            if (imageId == 0)
                throw new KeyNotFoundException("Image not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.movies.Add(new Persistence.Movie
            {
                MovieTitle = dto.MovieTitle,
                Duration = dto.Duration,
                Genre = dto.Genre,
                Director = dto.Director,
                Description = dto.Description,
                ImageId = imageId,
                Status = MovieStatus.Inactive
            });

            await _context.SaveChangesAsync();
            await trx.CommitAsync();

            return dto;
        }

        // Új vetítés létrehozása
        public async Task<NewScreeningDto> NewScreening(NewScreeningDto dto)
        {
            if (dto.FilmScreeningId != 0 &&
                await _context.filmScreenings.AnyAsync(x => x.FilmScreeningId == dto.FilmScreeningId))
            {
                throw new InvalidOperationException("Already exists");
            }

            var movie = await _context.movies.FirstOrDefaultAsync(x => x.MovieTitle == dto.MovieTitle);

            if (movie == null)
            {
                throw new KeyNotFoundException("Not Found");
            }

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.filmScreenings.Add(new Persistence.FilmScreening
            {
                MovieId = movie.MovieId,
                RoomId = dto.RoomId,
                RoomName = dto.RoomName,
                Date = dto.Date.ToUniversalTime()
            });

            await _context.SaveChangesAsync();
            await trx.CommitAsync();

            return dto;
        }

        // Új terem létrehozása
        public async Task<NewRoomDto> NewRoom(NewRoomDto dto)
        {
            if (dto.RoomId != 0 && await _context.rooms.AnyAsync(x => x.RoomId == dto.RoomId))
                throw new InvalidOperationException("Already exists");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.rooms.Add(new Persistence.Room
            {
                RoomId = dto.RoomId,
                RoomName = dto.RoomName
            });

            await _context.SaveChangesAsync();
            await trx.CommitAsync();

            return dto;
        }

        // Új jegytípus létrehozása
        public async Task<NewTicketTypeDto> NewTicketType(NewTicketTypeDto dto)
        {
            if (dto.TicketTypeId != 0 && await _context.ticketTypes.AnyAsync(x => x.TicketTypeId == dto.TicketTypeId))
                throw new InvalidOperationException("Already exists");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.ticketTypes.Add(new Persistence.TicketTypes
            {
                TicketType = dto.TicketType,
                TicketPrice = dto.TicketPrice,
            });

            await _context.SaveChangesAsync();
            await trx.CommitAsync();

            return dto;
        }

        // Új HTML kategória létrehozása
        public async Task<NewCategDto> NewCategDto(NewCategDto dto)
        {
            if (dto.CategId != 0 && await _context.categoriesForHTML.AnyAsync(x => x.CategoryId == dto.CategId))
                throw new InvalidOperationException("Already exists");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.categoriesForHTML.Add(new Persistence.CategoriesForHTML
            {
                CategoryName = dto.Name,
                CategoryDescription = dto.Description
            });

            await _context.SaveChangesAsync();
            await trx.CommitAsync();

            return dto;
        }

        // Film adatainak módosítása
        public async Task ModifyMovie(ModifyMovieDto dto)
        {
            var movie = await _context.movies.FirstOrDefaultAsync(x => x.MovieId == dto.MovieId);
            if (movie == null)
                throw new KeyNotFoundException("Movie not found");

            var imageId = await _context.images.Where(x => x.ImageId == dto.ImageId).Select(x => x.ImageId).FirstOrDefaultAsync();

            if (imageId == 0)
                throw new KeyNotFoundException("Image not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            movie.MovieTitle = dto.MovieTitle;
            movie.Duration = dto.Duration;
            movie.Genre = dto.Genre;
            movie.Director = dto.Director;
            movie.Description = dto.Description;
            movie.ImageId = imageId;
            movie.Status = dto.Status;


            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Vetítés adatainak módosítása
        public async Task ModifyFilmScreening(ModifyFilmScreeningDto dto)
        {
            var screening = await _context.filmScreenings.FirstOrDefaultAsync(x => x.FilmScreeningId == dto.FilmScreeningId);
            if (screening == null)
                throw new KeyNotFoundException("Screening not found");

            var MovieId = await _context.movies.FirstAsync(x => x.MovieTitle == dto.MovieTitle);

            using var trx = await _context.Database.BeginTransactionAsync();

            screening.MovieId = MovieId.MovieId;
            screening.RoomId = dto.RoomId;
            screening.RoomName = dto.RoomName;
            screening.Date = dto.Date.ToUniversalTime();

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Foglalás adatainak és székeinek módosítása
        public async Task ModifyReservation(ModifyReservationDto dto)
        {
            var reservation = await _context.paymentReservations
                .Include(x => x.Cart)
                    .ThenInclude(x => x.Seats).FirstOrDefaultAsync(x => x.PaymentReservationId == dto.PaymentReservationId);

            if (reservation == null)
                throw new KeyNotFoundException("Reservation not found");

            var ticket = await _context.tickets.Include(x=> x.TicketType).FirstOrDefaultAsync(x => x.TicketId == reservation.Cart.TicketId);
            if (ticket == null)
                throw new KeyNotFoundException("Ticket not found");

            if (dto.Amount <= 0)
                throw new InvalidDataException("Amount must be greater than 0");

            if (dto.Seats == null || !dto.Seats.Any())
                throw new InvalidOperationException("At least one seat must be selected");

            if (dto.Amount != dto.Seats.Count)
                throw new InvalidDataException("The number of selected seats must match the ticket amount");

            // Új székek azonosítóinak kigyűjtése
            var newSeatIds = dto.Seats.Select(x => x.SeatId).Distinct().ToList();

            if (newSeatIds.Count != dto.Seats.Count)
                throw new InvalidDataException("Duplicate seat selection is not allowed");

            // Megnézi, hogy az új székek közül foglalt-e valamelyik másik kosárban
            var conflictingSeatIds = await _context.carts.Where(x => x.FilmScreeningId == reservation.FilmScreeningId && x.CartId != reservation.CartId).SelectMany(x => x.Seats.Select(x => x.SeatId)).Where(seatId => newSeatIds.Contains(seatId)).Distinct().ToListAsync();

            if (conflictingSeatIds.Any())
                throw new InvalidOperationException("One or more selected seats are already reserved by another reservation");

            var seats = await _context.seats.Where(x => newSeatIds.Contains(x.SeatId)).ToListAsync();

            if (seats.Count != newSeatIds.Count)
                throw new KeyNotFoundException("One or more selected seats were not found");


            reservation.IsPaid = dto.IsPaid;
            reservation.Date = dto.Date;
            reservation.Cart.Amount = dto.Amount;
            reservation.Cart.TotalPrice = ticket.TicketType.TicketPrice * dto.Amount;

            foreach (var oldSeat in reservation.Cart.Seats)
            {
                oldSeat.CartId = null;
                oldSeat.IsReserved = false;
            }

            reservation.Cart.Seats.Clear();

            foreach (var seat in seats)
            {
                seat.CartId = reservation.Cart.CartId;
                seat.IsReserved = true;
                reservation.Cart.Seats.Add(seat);
            }

            await _context.SaveChangesAsync();
        }

        // Terem adatainak módosítása
        public async Task ModifyRoom(ModifyRoomDto dto, int roomId)
        {
            var room = await _context.rooms.FirstOrDefaultAsync(x => x.RoomId == roomId);
            if (room == null)
                throw new KeyNotFoundException("Room not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            room.RoomName = dto.RoomName;

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Jegytípus adatainak módosítása
        public async Task ModifyTicketType(ModifyTicketTypeDto dto, int ticketTId)
        {
            var ticketT = await _context.ticketTypes.FirstOrDefaultAsync(x => x.TicketTypeId == ticketTId);
            if (ticketT == null)
                throw new KeyNotFoundException("TicketType not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            ticketT.TicketType = dto.TicketType;
            ticketT.TicketPrice = dto.TicketPrice;

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Kategória adatainak módosítása
        public async Task ModifyCateg(ModifyCategDto dto, int categId)
        {
            var categ = await _context.categoriesForHTML.FirstOrDefaultAsync(x => x.CategoryId == categId);
            if (categ == null)
                throw new KeyNotFoundException("Category not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            categ.CategoryName = dto.Name;
            categ.CategoryDescription = dto.Description;

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Felhasználó törlése a hozzá tartozó kosarakkal és foglalásokkal együtt
        public async Task DeleteUser(int userId)
        {
            var user = await _context.users.FirstOrDefaultAsync(x => x.UserId == userId);
            if (user == null)
                throw new KeyNotFoundException("User not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            // user cartjai
            var userCarts = await _context.carts.Include(x => x.Seats).Where(x => x.UserId == userId).ToListAsync();

            var userCartIds = userCarts.Select(x => x.CartId).ToList();

            // user foglalásai
            var reservations = await _context.paymentReservations.Where(x => x.UserId == userId).ToListAsync();

            // seat-ek leválasztása a cartokról
            var seats = await _context.seats.Where(x => x.CartId != null && userCartIds.Contains(x.CartId.Value)).ToListAsync();

            foreach (var seat in seats)
            {
                seat.CartId = null;
                seat.IsReserved = false;
            }

            // foglalások törlése
            if (reservations.Any())
                _context.paymentReservations.RemoveRange(reservations);

            // cartok törlése
            if (userCarts.Any())
                _context.carts.RemoveRange(userCarts);

            // user törlése
            _context.users.Remove(user);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Film törlése
        public async Task DeleteMovie(int movieId)
        {
            var movie = await _context.movies.FirstOrDefaultAsync(x => x.MovieId == movieId);
            if (movie == null)
                throw new KeyNotFoundException("Movie not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.movies.Remove(movie);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Vetítés törlése
        public async Task DeleteScreening(int screeningId)
        {
            var screening = await _context.filmScreenings.FirstOrDefaultAsync(x => x.FilmScreeningId == screeningId);
            if (screening == null)
                throw new KeyNotFoundException("Screening not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.filmScreenings.Remove(screening);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Terem törlése
        public async Task DeleteRoom(int roomId)
        {
            var room = await _context.rooms.FirstOrDefaultAsync(x => x.RoomId == roomId);
            if (room == null)
                throw new KeyNotFoundException("Room not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.rooms.Remove(room);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Foglalás törlése és székek felszabadítása
        public async Task DeleteReservation(int reservationId)
        {
            var reservation = await _context.paymentReservations
                .Include(x => x.Cart)
                    .ThenInclude(x => x.Seats)
                .FirstOrDefaultAsync(x => x.PaymentReservationId == reservationId);
            if (reservation == null)
                throw new KeyNotFoundException("Reservation not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            if (reservation.Cart != null)
            {
                foreach (var seat in reservation.Cart.Seats)
                {
                    seat.CartId = null;
                    seat.IsReserved = false;
                }

                _context.carts.Remove(reservation.Cart);
            }

            _context.paymentReservations.Remove(reservation);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Jegytípus törlése
        public async Task DeleteTicketT(int ticketTId)
        {
            var ticketType = await _context.ticketTypes.FirstOrDefaultAsync(x => x.TicketTypeId == ticketTId);
            if (ticketType == null)
                throw new KeyNotFoundException("Ticket type not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.ticketTypes.Remove(ticketType);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Kategória törlése
        public async Task DeleteCateg(int categId)
        {
            var categ = await _context.categoriesForHTML.FirstOrDefaultAsync(x => x.CategoryId == categId);
            if (categ == null)
                throw new KeyNotFoundException("Category not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.categoriesForHTML.Remove(categ);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Kép feltöltése
        public async Task<ImageDto> UploadImage(ImageDto dto)
        {
            using var trx = await _context.Database.BeginTransactionAsync();

            var image = new Image
            {
                ImageContent = dto.ImageContent
            };

            _context.images.Add(image);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();

            return new ImageDto
            {
                ImageId = image.ImageId,
                ImageContent = image.ImageContent
            };
        }

        // Kép törlése, ha nincs filmhez rendelve
        public async Task DeleteImage(int imageId)
        {
            var image = await _context.images.FirstOrDefaultAsync(x => x.ImageId == imageId);
            if (image == null)
                throw new KeyNotFoundException("Image not found");

            if (await _context.movies.AnyAsync(m => m.ImageId == imageId))
                throw new InvalidOperationException("Image is already exist");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.images.Remove(image);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        // Felhasználó szerepkörének módosítása
        public async Task ChangeRole(int userId, string newRole, int actAdminId)
        {
            if (userId == actAdminId)
                throw new InvalidCastException("You cannot change your own role.");

            var user = await _context.users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                throw new KeyNotFoundException("User not found");

            if (user.Role == "Admin" && newRole != "Admin")
                throw new InvalidOperationException("You cannot demote another Admin.");

            user.Role = newRole;
            await _context.SaveChangesAsync();
        }
    }
}