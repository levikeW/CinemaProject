using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
            var cart = _context.carts
                .Where(c => c.CartId == cartId)
                .FirstOrDefault();

            if (cart == null)
                throw new Exception("Cart not found");

            var reservation = new PaymentReservation
            {
                CartId = cart.CartId,
                Date = DateTime.UtcNow,
                IsPaid = false,
                UserId = cart.UserId,
                FilmScreeningId = cart.FilmScreeningId,
                Amount = cart.Amount
            };

            _context.paymentReservations.Add(reservation);
            _context.SaveChanges();

            return _context.paymentReservations
                .Where(x => x.PaymentReservationId == reservation.PaymentReservationId)
                .Select(x => new ConfirmationDto
                {
                    ReservationId = x.PaymentReservationId,
                    MovieTitle = x.Cart.FilmScreening.Movie.MovieTitle,
                    ScreeningDate = x.Cart.FilmScreening.Date,
                    RoomName = x.Cart.FilmScreening.Room.RoomName,
                    Seats = x.Cart.Seats.Select(y => $"Row {y.RowNumber}, Seat {y.SeatNumber}").ToList(),
                    TicketId = x.Cart.TicketId,
                    Amount = x.Cart.Amount,
                    TotalPrice = x.Cart.Ticket.TicketPrice * x.Cart.Amount,
                    UserEmail = x.Cart.User.Email
                })
                .First();
        }

        public async Task CancelReservation(int reservationId)
        {
            var reservation = _context.paymentReservations.FirstOrDefault(x => x.PaymentReservationId == reservationId);
            if (reservation == null)
            {
                throw new InvalidOperationException("Reservation not found");
            }
            if (reservation.IsPaid)
            {
                throw new InvalidOperationException("Cannot cancel a paid reservation");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                _context.paymentReservations.Remove(reservation);
                await _context.SaveChangesAsync();
                await trx.CommitAsync();
            }
        }

        public async Task<ReceiptDto> PayReservation(int reservationId)
        {
            var reservation = _context.paymentReservations.FirstOrDefault(x => x.PaymentReservationId == reservationId);
            if (reservation == null)
            {
                throw new InvalidOperationException("Reservation not found");
            }
            reservation.IsPaid = true;
            reservation.Date = DateTime.UtcNow;

            _context.SaveChanges();

            return _context.paymentReservations.Where(x => x.PaymentReservationId == reservationId).Select(x => new ReceiptDto
            {
                ReceiptId = x.PaymentReservationId,
                PaymentReservationId = x.PaymentReservationId,
                MovieTitle = x.Cart.FilmScreening.Movie.MovieTitle,
                ScreeningDate = x.Cart.FilmScreening.Date,
                RoomName = x.Cart.FilmScreening.Room.RoomName,
                Seats = x.Cart.Seats.Select(y => $"Row {y.RowNumber}, Seat {y.SeatNumber}").ToList(),
                TicketId = x.Cart.TicketId,
                Amount = x.Cart.Amount,
                TotalPrice = x.Cart.Ticket.TicketPrice * x.Cart.Amount,
                PaymentDate = x.Date,
                UserEmail = x.Cart.User.Email
            }).First();

        }

        public async Task<ReceiptDto?> GetReceipt(int reservationId)
        {
            return _context.paymentReservations.Where(x => x.PaymentReservationId == reservationId).Select(x => new ReceiptDto
            {
                ReceiptId = x.PaymentReservationId,
                PaymentReservationId = x.PaymentReservationId,
                MovieTitle = x.Cart.FilmScreening.Movie.MovieTitle,
                ScreeningDate = x.Cart.FilmScreening.Date,
                RoomName = x.Cart.FilmScreening.Room.RoomName,
                Seats = x.Cart.Seats.Select(y => $"Row {y.RowNumber}, Seat {y.SeatNumber}").ToList(),
                TicketId = x.Cart.TicketId,
                Amount = x.Cart.Amount,
                TotalPrice = x.Cart.Ticket.TicketPrice * x.Cart.Amount,
                PaymentDate = x.Date,
                UserEmail = x.Cart.User.Email
            }).FirstOrDefault();
        }

        public async Task<ConfirmationDto?> GetConfirmation(int reservationId)
        {
            return _context.paymentReservations.Where(x => x.PaymentReservationId == reservationId).Select(x => new ConfirmationDto
            {
                ReservationId = x.PaymentReservationId,
                MovieTitle = x.Cart.FilmScreening.Movie.MovieTitle,
                ScreeningDate = x.Cart.FilmScreening.Date,
                RoomName = x.Cart.FilmScreening.Room.RoomName,
                Seats = x.Cart.Seats.Select(y => $"Row {y.RowNumber}, Seat {y.SeatNumber}").ToList(),
                TicketId = x.Cart.TicketId,
                Amount = x.Cart.Amount,
                TotalPrice = x.Cart.Ticket.TicketPrice * x.Cart.Amount,
                UserEmail = x.Cart.User.Email
            }).FirstOrDefault();
        }

        public async Task<List<PaymentReservationDto>> ViewUpcomigReservations(int userId)
        {
            var now = DateTime.UtcNow;

            return _context.paymentReservations.Include(p => p.Cart)
                .ThenInclude(c => c.Ticket)
                .Include(p => p.Cart)
                    .ThenInclude(c => c.Seats)
                .Include(p => p.Cart)
                    .ThenInclude(c => c.FilmScreening)
                .AsEnumerable()
                .Where(x => x.Cart.UserId == userId
                            && x.Cart.FilmScreening.Date >= now)
                .Select(x => new PaymentReservationDto
                {
                    PaymentReservationId = x.PaymentReservationId,
                    CartId = x.CartId,
                    Date = x.Date,
                    IsPaid = x.IsPaid,
                    Amount = x.Cart.Amount,
                    Price = x.Cart.Ticket.TicketPrice * x.Cart.Amount,
                    Seats = x.Cart.Seats.Select(s => new SeatDto
                    {
                        SeatId = s.SeatId,
                        RowNumber = s.RowNumber,
                        SeatNumber = s.SeatNumber,
                        RoomId = s.RoomId,
                        IsReserved = s.IsReserved
                    }).ToList()
                })
                .ToList();
        }

        public async Task<List<PaymentReservationDto>> ViewPastReservations(int userId)
        {
            var now = DateTime.UtcNow;

            return _context.paymentReservations.Include(p => p.Cart)
                    .ThenInclude(c => c.Ticket)
                .Include(p => p.Cart)
                    .ThenInclude(c => c.Seats)
                .Include(p => p.Cart)
                    .ThenInclude(c => c.FilmScreening)
                .AsEnumerable()
                .Where(x => x.Cart.UserId == userId
                            && x.Cart.FilmScreening.Date < now)
                .Select(x => new PaymentReservationDto
                {
                    PaymentReservationId = x.PaymentReservationId,
                    CartId = x.CartId,
                    Date = x.Date,
                    IsPaid = x.IsPaid,
                    Amount = x.Cart.Amount,
                    Price = x.Cart.Ticket.TicketPrice * x.Cart.Amount,
                    Seats = x.Cart.Seats.Select(s => new SeatDto
                    {
                        SeatId = s.SeatId,
                        RowNumber = s.RowNumber,
                        SeatNumber = s.SeatNumber,
                        RoomId = s.RoomId,
                        IsReserved = s.IsReserved
                    }).ToList()
                })
                .ToList();
        }
    }
}
