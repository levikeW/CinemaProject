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

        public async Task<ConfirmationDto> CreateReservation(int cartId)
        {
            if (await _context.paymentReservations.AnyAsync(x => x.CartId == cartId))
                throw new InvalidOperationException("Reservation already exists for this cart");

            var cart = await _context.carts.FirstOrDefaultAsync(c => c.CartId == cartId);

            if (cart == null)
                throw new InvalidOperationException("Cart not found");

            using var trx = await _context.Database.BeginTransactionAsync();

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
                    Seats = x.Cart.Seats.Select(y => $"Row {y.RowNumber}, Seat {y.SeatNumber}").ToList(),
                    TicketId = x.Cart.TicketId,
                    Amount = x.Cart.Amount,
                    TotalPrice = x.Cart.Ticket.TicketType.TicketPrice * x.Cart.Amount,
                    UserEmail = x.Cart.User.Email
                }).FirstAsync();
        }

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

        public async Task CancelReservation(int reservationId)
        {
            var reservation = await _context.paymentReservations
                .Include(x => x.Cart)
                    .ThenInclude(x => x.Seats)
                .FirstOrDefaultAsync(x => x.PaymentReservationId == reservationId);

            if (reservation == null)
                throw new InvalidOperationException("Reservation not found");

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

        public async Task<ReceiptDto> PayReservation(int reservationId)
        {
            var reservation = await _context.paymentReservations.FirstOrDefaultAsync(x => x.PaymentReservationId == reservationId);

            if (reservation == null)
                throw new InvalidOperationException("Reservation not found");

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
                    Seats = x.Cart.Seats.Select(y => $"Row {y.RowNumber}, Seat {y.SeatNumber}").ToList(),
                    TicketId = x.Cart.TicketId,
                    Amount = x.Cart.Amount,
                    TotalPrice = x.Cart.Ticket.TicketType.TicketPrice * x.Cart.Amount,
                    PaymentDate = x.Date,
                    UserEmail = x.Cart.User.Email
                }).FirstAsync();
        }

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
                    Seats = x.Cart.Seats.Select(y => $"Row {y.RowNumber}, Seat {y.SeatNumber}").ToList(),
                    TicketId = x.Cart.TicketId,
                    Amount = x.Cart.Amount,
                    TotalPrice = x.Cart.Ticket.TicketType.TicketPrice * x.Cart.Amount,
                    PaymentDate = x.Date,
                    UserEmail = x.Cart.User.Email
                }).FirstOrDefaultAsync();
        }

        public async Task<ConfirmationDto?> GetConfirmation(int reservationId)
        {
            return await _context.paymentReservations.Where(x => x.PaymentReservationId == reservationId)
                .Select(x => new ConfirmationDto
                {
                    ReservationId = x.PaymentReservationId,
                    MovieTitle = x.Cart.FilmScreening.Movie.MovieTitle,
                    ScreeningDate = x.Cart.FilmScreening.Date,
                    RoomName = x.Cart.FilmScreening.Room.RoomName,
                    Seats = x.Cart.Seats.Select(y => $"Row {y.RowNumber}, Seat {y.SeatNumber}").ToList(),
                    TicketId = x.Cart.TicketId,
                    Amount = x.Cart.Amount,
                    TotalPrice = x.Cart.Ticket.TicketType.TicketPrice * x.Cart.Amount,
                    UserEmail = x.Cart.User.Email
                }).FirstOrDefaultAsync();
        }

        public async Task<List<PaymentReservationDto>> ViewUpcomigReservations(int userId)
        {
            var now = DateTimeOffset.UtcNow;

            return await _context.paymentReservations
                .Include(p => p.Cart)
                    .ThenInclude(c => c.Ticket)
                .Include(p => p.Cart)
                    .ThenInclude(c => c.Seats)
                .Include(p => p.Cart)
                    .ThenInclude(c => c.FilmScreening)
                .Where(x => x.UserId == userId && x.FilmScreening.Date >= now)
                .Select(x => new PaymentReservationDto
                {
                    PaymentReservationId = x.PaymentReservationId,
                    CartId = x.CartId,
                    Date = x.Date,
                    IsPaid = x.IsPaid,
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

        public async Task<List<PaymentReservationDto>> ViewPastReservations(int userId)
        {
            var now = DateTimeOffset.UtcNow;

            return await _context.paymentReservations
                .Include(p => p.Cart)
                    .ThenInclude(c => c.Ticket)
                .Include(p => p.Cart)
                    .ThenInclude(c => c.Seats)
                .Include(p => p.Cart)
                    .ThenInclude(c => c.FilmScreening)
                .Where(x => x.UserId == userId && x.FilmScreening.Date < now)
                .Select(x => new PaymentReservationDto
                {
                    PaymentReservationId = x.PaymentReservationId,
                    CartId = x.CartId,
                    Date = x.Date,
                    IsPaid = x.IsPaid,
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
    }
}