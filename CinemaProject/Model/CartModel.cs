using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CinemaProject.Model
{
    public class CartModel
    {
        private readonly CinemaDbContext _context;
        public CartModel(CinemaDbContext context)
        {
            _context = context;
        }
        public void AddToCart(CartDto dto)
        {
            using var trx = _context.Database.BeginTransaction();
            {
                var seatIds = dto.Seats.Select(s => s.SeatId).ToList();
                var seats = _context.seats.Where(x => seatIds.Contains(x.SeatId)).ToList();
                _context.carts.Add(new Cart
                {
                    UserId = dto.UserId,
                    FilmScreeningId = dto.FilmScreeningId,
                    Seats = seats,
                    TicketId = dto.TicketId,
                    Amount = dto.Amount
                });
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void RemoveFromCart(int cartId)
        {
            if (!_context.carts.Any(x => x.CartId == cartId))
            {
                throw new InvalidOperationException("Cart not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                _context.carts.Remove(_context.carts.Where(x => x.CartId == cartId).First());
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void CreateReservation(int cartId)
        {
            using var trx = _context.Database.BeginTransaction();
            {
                _context.paymentReservations.Add(new PaymentReservation
                {
                    CartId = cartId,
                    Date = DateTime.Now,
                    IsPaid = false
                });
                _context.SaveChanges();
                trx.Commit();
            }
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

        public void PayReservation(int reservationId)
        {
            var reservation = _context.paymentReservations.Include(x => x.Cart).FirstOrDefault(x => x.PaymentReservationId == reservationId);
            if (reservation == null)
            {
                throw new InvalidOperationException("Reservation not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                reservation.IsPaid = true;
                reservation.Date = DateTime.Now;

                _context.SaveChanges();
                trx.Commit();
            }
        }

        public ReceiptDto GetReceipt(int reservationId)
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

        public decimal GetTotalPrice(int cartId)
        {
            var cart = _context.carts.Include(x => x.Ticket).FirstOrDefault(x => x.CartId == cartId);
            if (cart == null)
            {
                throw new InvalidOperationException("Cart not found");
            }
            return cart.Ticket.TicketPrice * cart.Amount;
        }
    }
}
