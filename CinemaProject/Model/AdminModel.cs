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
                    Seats = x.Cart.Seats.Select(s => new SeatDto
                    {
                        SeatId = s.SeatId,
                        RowNumber = s.RowNumber,
                        SeatNumber = s.SeatNumber,
                        RoomId = s.RoomId,
                        IsReserved = s.IsReserved
                    }).ToList()
                }).ToListAsync();
        }

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

        public async Task<NewMovieDto> NewMovie(NewMovieDto dto)
        {
            if (await _context.movies.AnyAsync(x => x.MovieTitle == dto.MovieTitle))
                throw new InvalidOperationException("Already exists");

            var imageId = await _context.images.Where(x => x.ImageId == dto.ImageId).Select(x => x.ImageId).FirstOrDefaultAsync();

            if (imageId == 0)
                throw new InvalidOperationException("Image not found");

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
                throw new InvalidOperationException("Not Found");
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

        public async Task ModifyMovie(ModifyMovieDto dto)
        {
            var movie = await _context.movies.FirstOrDefaultAsync(x => x.MovieId == dto.MovieId);
            if (movie == null)
                throw new InvalidOperationException("Movie not found");

            var imageId = await _context.images.Where(x => x.ImageId == dto.ImageId).Select(x => x.ImageId).FirstOrDefaultAsync();

            if (imageId == 0)
                throw new InvalidOperationException("Image not found");

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

        public async Task ModifyFilmScreening(ModifyFilmScreeningDto dto)
        {
            var screening = await _context.filmScreenings.FirstOrDefaultAsync(x => x.FilmScreeningId == dto.FilmScreeningId);
            if (screening == null)
                throw new InvalidOperationException("Screening not found");

            var MovieId = await _context.movies.FirstAsync(x => x.MovieTitle == dto.MovieTitle);

            using var trx = await _context.Database.BeginTransactionAsync();

            screening.MovieId = MovieId.MovieId;
            screening.RoomId = dto.RoomId;
            screening.RoomName = dto.RoomName;
            screening.Date = dto.Date.ToUniversalTime();

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task ModifyReservation(ModifyReservationDto dto, int reservationId)
        {
            var reservation = await _context.paymentReservations
                .Include(p => p.Cart)
                    .ThenInclude(c => c.Seats).FirstOrDefaultAsync(p => p.PaymentReservationId == reservationId);

            if (reservation == null)
                throw new InvalidOperationException("Reservation not found");

            var ticket = await _context.tickets.Include(x=> x.TicketType).FirstOrDefaultAsync(t => t.TicketId == reservation.Cart.TicketId);
            if (ticket == null)
                throw new InvalidOperationException("Ticket not found");

            if (dto.Amount <= 0)
                throw new InvalidOperationException("Amount must be greater than 0");

            if (dto.Seats == null || !dto.Seats.Any())
                throw new InvalidOperationException("At least one seat must be selected");

            if (dto.Amount != dto.Seats.Count)
                throw new InvalidOperationException("The number of selected seats must match the ticket amount");

            var newSeatIds = dto.Seats.Select(s => s.SeatId).Distinct().ToList();

            if (newSeatIds.Count != dto.Seats.Count)
                throw new InvalidOperationException("Duplicate seat selection is not allowed");

            var conflictingSeatIds = await _context.carts.Where(c => c.FilmScreeningId == reservation.FilmScreeningId && c.CartId != reservation.CartId).SelectMany(c => c.Seats.Select(s => s.SeatId)).Where(seatId => newSeatIds.Contains(seatId)).Distinct().ToListAsync();

            if (conflictingSeatIds.Any())
                throw new InvalidOperationException("One or more selected seats are already reserved by another reservation");

            var seats = await _context.seats.Where(s => newSeatIds.Contains(s.SeatId)).ToListAsync();

            if (seats.Count != newSeatIds.Count)
                throw new InvalidOperationException("One or more selected seats were not found");


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

        public async Task ModifyRoom(ModifyRoomDto dto, int roomId)
        {
            var room = await _context.rooms.FirstOrDefaultAsync(x => x.RoomId == roomId);
            if (room == null)
                throw new InvalidOperationException("Room not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            room.RoomName = dto.RoomName;

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task ModifyTicketType(ModifyTicketTypeDto dto, int ticketTId)
        {
            var ticketT = await _context.ticketTypes.FirstOrDefaultAsync(x => x.TicketTypeId == ticketTId);
            if (ticketT == null)
                throw new InvalidOperationException("TicketType not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            ticketT.TicketType = dto.TicketType;
            ticketT.TicketPrice = dto.TicketPrice;

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task ModifyCateg(ModifyCategDto dto, int categId)
        {
            var categ = await _context.categoriesForHTML.FirstOrDefaultAsync(x => x.CategoryId == categId);
            if (categ == null)
                throw new InvalidOperationException("Category not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            categ.CategoryName = dto.Name;
            categ.CategoryDescription = dto.Description;

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task DeleteUser(int userId)
        {
            var user = await _context.users.FirstOrDefaultAsync(x => x.UserId == userId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            // user cartjai
            var userCarts = await _context.carts.Include(c => c.Seats).Where(c => c.UserId == userId).ToListAsync();

            var userCartIds = userCarts.Select(c => c.CartId).ToList();

            // user foglalásai
            var reservations = await _context.paymentReservations.Where(r => r.UserId == userId).ToListAsync();

            // seat-ek leválasztása a cartokról
            var seats = await _context.seats.Where(s => s.CartId != null && userCartIds.Contains(s.CartId.Value)).ToListAsync();

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

        public async Task DeleteMovie(int movieId)
        {
            var movie = await _context.movies.FirstOrDefaultAsync(x => x.MovieId == movieId);
            if (movie == null)
                throw new InvalidOperationException("Movie not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.movies.Remove(movie);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task DeleteScreening(int screeningId)
        {
            var screening = await _context.filmScreenings.FirstOrDefaultAsync(x => x.FilmScreeningId == screeningId);
            if (screening == null)
                throw new InvalidOperationException("Screening not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.filmScreenings.Remove(screening);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task DeleteRoom(int roomId)
        {
            var room = await _context.rooms.FirstOrDefaultAsync(x => x.RoomId == roomId);
            if (room == null)
                throw new InvalidOperationException("Room not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.rooms.Remove(room);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task DeleteReservation(int reservationId)
        {
            var reservation = await _context.paymentReservations.FirstOrDefaultAsync(x => x.PaymentReservationId == reservationId);
            if (reservation == null)
                throw new InvalidOperationException("Reservation not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.paymentReservations.Remove(reservation);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task DeleteTicketT(int ticketTId)
        {
            var ticketType = await _context.ticketTypes.FirstOrDefaultAsync(x => x.TicketTypeId == ticketTId);
            if (ticketType == null)
                throw new InvalidOperationException("Ticket type not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.ticketTypes.Remove(ticketType);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task DeleteCateg(int categId)
        {
            var categ = await _context.categoriesForHTML.FirstOrDefaultAsync(x => x.CategoryId == categId);
            if (categ == null)
                throw new InvalidOperationException("Category not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.categoriesForHTML.Remove(categ);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

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

        public async Task DeleteImage(int imageId)
        {
            var image = await _context.images.FirstOrDefaultAsync(x => x.ImageId == imageId);
            if (image == null)
                throw new InvalidOperationException("Image not found");

            if (await _context.movies.AnyAsync(m => m.ImageId == imageId))
                throw new InvalidOperationException("Image is already exist");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.images.Remove(image);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task ChangeRole(int userId, string newRole, int actAdminId)
        {
            if (userId == actAdminId)
                throw new InvalidOperationException("You cannot change your own role.");

            var user = await _context.users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            if (user.Role == "Admin" && newRole != "Admin")
                throw new InvalidOperationException("You cannot demote another Admin.");

            user.Role = newRole;
            await _context.SaveChangesAsync();
        }
    }
}