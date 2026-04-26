using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;
using System;

namespace CinemaProject.Model
{
    public class Payment_ReservationModel
    {
        private readonly CinemaDbContext _context;

        public Payment_ReservationModel(CinemaDbContext context)
        {
            _context = context;
        }

        // Új foglalás létrehozása egy kosárból + confirmation visszaadása
        public async Task<ConfirmationDto> CreateReservation(int cartId)
        {
            if (await _context.paymentReservations.AnyAsync(x => x.CartId == cartId))
                throw new InvalidOperationException("Reservation already exists for this cart");

            var cart = await _context.carts.FirstOrDefaultAsync(x => x.CartId == cartId);

            if (cart == null)
                throw new KeyNotFoundException("Cart not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            // ID ütközés elkerülése
            await AlignPaymentReservationSequenceAsync();

            var reservation = new PaymentReservation
            {
                CartId = cart.CartId,
                Date = DateTimeOffset.UtcNow,
                IsPaid = false,
                UserId = cart.UserId,
                FilmScreeningId = cart.FilmScreeningId,
                Amount = cart.Amount
            };

            _context.paymentReservations.Add(reservation);
            await _context.SaveChangesAsync();

            await trx.CommitAsync();

            return await _context.paymentReservations.Where(x => x.PaymentReservationId == reservation.PaymentReservationId)
                .Select(x => new ConfirmationDto
                {
                    ReservationId = x.PaymentReservationId,
                    MovieTitle = x.Cart.FilmScreening.Movie.MovieTitle,
                    ScreeningDate = x.Cart.FilmScreening.Date,
                    RoomName = x.Cart.FilmScreening.Room.RoomName,
                    Seats = x.Cart.Seats.Select(x => $"Row {x.RowNumber}, Seat {x.SeatNumber}").ToList(),
                    TicketId = x.Cart.TicketId,
                    Amount = x.Cart.Amount,
                    TotalPrice = x.Cart.Ticket.TicketType.TicketPrice * x.Cart.Amount,
                    UserEmail = x.Cart.User.Email
                }).FirstAsync();
        }

        // Foglalás törlése és a hozzá tartozó helyek felszabadítása
        public async Task CancelReservation(int reservationId)
        {
            var reservation = await _context.paymentReservations
                .Include(x => x.Cart)
                    .ThenInclude(x => x.Seats)
                .FirstOrDefaultAsync(x => x.PaymentReservationId == reservationId);

            if (reservation == null)
                throw new KeyNotFoundException("Reservation not found");

            if (reservation.IsPaid)
                throw new InvalidOperationException("Cannot cancel a paid reservation");

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

        // Foglalás kifizetése és nyugta visszaadása
        public async Task<ReceiptDto> PayReservation(int reservationId)
        {
            var reservation = await _context.paymentReservations.FirstOrDefaultAsync(x => x.PaymentReservationId == reservationId);

            if (reservation == null)
                throw new KeyNotFoundException("Reservation not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            reservation.IsPaid = true;
            reservation.Date = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            await trx.CommitAsync();

            return await _context.paymentReservations.Where(x => x.PaymentReservationId == reservationId)
                .Select(x => new ReceiptDto
                {
                    ReceiptId = x.PaymentReservationId,
                    PaymentReservationId = x.PaymentReservationId,
                    MovieTitle = x.Cart.FilmScreening.Movie.MovieTitle,
                    ScreeningDate = x.Cart.FilmScreening.Date,
                    RoomName = x.Cart.FilmScreening.Room.RoomName,
                    Seats = x.Cart.Seats.Select(x => $"Row {x.RowNumber}, Seat {x.SeatNumber}").ToList(),
                    TicketId = x.Cart.TicketId,
                    Amount = x.Cart.Amount,
                    TotalPrice = x.Cart.Ticket.TicketType.TicketPrice * x.Cart.Amount,
                    PaymentDate = x.Date,
                    UserEmail = x.Cart.User.Email
                }).FirstAsync();
        }

        // Nyugta lekérése foglalás alapján
        public async Task<ReceiptDto?> GetReceipt(int reservationId)
        {
            return await _context.paymentReservations.Where(x => x.PaymentReservationId == reservationId)
                .Select(x => new ReceiptDto
                {
                    ReceiptId = x.PaymentReservationId,
                    PaymentReservationId = x.PaymentReservationId,
                    MovieTitle = x.Cart.FilmScreening.Movie.MovieTitle,
                    ScreeningDate = x.Cart.FilmScreening.Date,
                    RoomName = x.Cart.FilmScreening.Room.RoomName,
                    Seats = x.Cart.Seats.Select(x => $"Row {x.RowNumber}, Seat {x.SeatNumber}").ToList(),
                    TicketId = x.Cart.TicketId,
                    Amount = x.Cart.Amount,
                    TotalPrice = x.Cart.Ticket.TicketType.TicketPrice * x.Cart.Amount,
                    PaymentDate = x.Date,
                    UserEmail = x.Cart.User.Email
                }).FirstOrDefaultAsync();
        }

        // Foglalás visszaigazolás lekérése
        public async Task<ConfirmationDto?> GetConfirmation(int reservationId)
        {
            return await _context.paymentReservations.Where(x => x.PaymentReservationId == reservationId)
                .Select(x => new ConfirmationDto
                {
                    ReservationId = x.PaymentReservationId,
                    MovieTitle = x.Cart.FilmScreening.Movie.MovieTitle,
                    ScreeningDate = x.Cart.FilmScreening.Date,
                    RoomName = x.Cart.FilmScreening.Room.RoomName,
                    Seats = x.Cart.Seats.Select(x => $"Row {x.RowNumber}, Seat {x.SeatNumber}").ToList(),
                    TicketId = x.Cart.TicketId,
                    Amount = x.Cart.Amount,
                    TotalPrice = x.Cart.Ticket.TicketType.TicketPrice * x.Cart.Amount,
                    UserEmail = x.Cart.User.Email
                }).FirstOrDefaultAsync();
        }

        // Közelgő foglalások lekérése a felhasználónak
        public async Task<List<PaymentReservationDto>> ViewUpcomigReservations(int userId)
        {
            var now = DateTimeOffset.UtcNow;

            return await _context.paymentReservations
                .Include(x => x.Cart)
                    .ThenInclude(c => c.Ticket)
                .Include(x => x.Cart)
                    .ThenInclude(c => c.Seats)
                .Include(x => x.Cart)
                    .ThenInclude(x => x.FilmScreening)
                .Where(x => x.UserId == userId && x.FilmScreening.Date >= now)
                .Select(x => new PaymentReservationDto
                {
                    PaymentReservationId = x.PaymentReservationId,
                    CartId = x.CartId,
                    Date = x.Date,
                    IsPaid = x.IsPaid,
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

        // Korábbi foglalások lekérése a felhasználónak
        public async Task<List<PaymentReservationDto>> ViewPastReservations(int userId)
        {
            var now = DateTimeOffset.UtcNow;

            return await _context.paymentReservations
                .Include(x => x.Cart)
                    .ThenInclude(x => x.Ticket)
                .Include(x => x.Cart)
                    .ThenInclude(x => x.Seats)
                .Include(x => x.Cart)
                    .ThenInclude(x => x.FilmScreening)
                .Where(x => x.UserId == userId && x.FilmScreening.Date < now)
                .Select(x => new PaymentReservationDto
                {
                    PaymentReservationId = x.PaymentReservationId,
                    CartId = x.CartId,
                    Date = x.Date,
                    IsPaid = x.IsPaid,
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

        // Foglalás mentése előtt helyrerakja az automatikus ID számlálót, hogy ne ID ütközéssss
        private async Task AlignPaymentReservationSequenceAsync()
        {
            if (!string.Equals(_context.Database.ProviderName, "Npgsql.EntityFrameworkCore.PostgreSQL", StringComparison.Ordinal))
                return;

            await _context.Database.ExecuteSqlRawAsync(@"
                SELECT setval(
                    pg_get_serial_sequence('""paymentReservations""', 'PaymentReservationId'),
                    COALESCE((SELECT MAX(""PaymentReservationId"") FROM ""paymentReservations""), 0) + 1,
                    false
                );
            ");
        }
    }
}