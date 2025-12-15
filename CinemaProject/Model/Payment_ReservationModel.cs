using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaProject.Model
{
    public class Payment_ReservationModel
    {
        private readonly CinemaDbContext _context;
        public Payment_ReservationModel(CinemaDbContext context)
        {
            _context = context;
        }
        public ConfirmationDto CreateReservation(int cartId)
        {
            var reservation = new PaymentReservation
            {
                CartId = cartId,
                Date = DateTime.UtcNow,
                IsPaid = false
            };
            _context.paymentReservations.Add(reservation);
            _context.SaveChanges();
            return _context.paymentReservations.Where(x => x.PaymentReservationId == reservation.PaymentReservationId).Select(x => new ConfirmationDto
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
            }).First();
        }

        public void CancelReservation(int reservationId)
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
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public ReceiptDto PayReservation(int reservationId)
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

        public ReceiptDto? GetReceipt(int reservationId)
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

        public ConfirmationDto? GetConfirmation(int reservationId)
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

        public List<PaymentReservationDto> ViewUpcomigReservations(int userId)
        {
            var now = DateTime.UtcNow;
            return _context.paymentReservations.Where(x => x.Cart.UserId == userId && x.Cart.FilmScreening.Date >= now).Select(x => new PaymentReservationDto
            {
                PaymentReservationId = x.PaymentReservationId,
                CartId = x.CartId,
                Date = x.Date,
                IsPaid = x.IsPaid,
                Amount = x.Cart.Amount,
                Price = x.Cart.Ticket.TicketPrice * x.Cart.Amount,
                Seats = x.Cart.Seats.ToList(),
            }).ToList();
        }

        public List<PaymentReservationDto> ViewPastReservations(int userId)
        {
            var now = DateTime.UtcNow;
            return _context.paymentReservations.Where(x => x.Cart.UserId == userId && x.Cart.FilmScreening.Date < now).Select(x => new PaymentReservationDto
            {
                PaymentReservationId = x.PaymentReservationId,
                CartId = x.CartId,
                Date = x.Date,
                IsPaid = x.IsPaid,
                Amount = x.Cart.Amount,
                Price = x.Cart.Ticket.TicketPrice * x.Cart.Amount,
                Seats = x.Cart.Seats.ToList(),
            }).ToList();
        }
    }
}
