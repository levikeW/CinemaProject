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
        public IEnumerable<CartDto> GetCart(CartDto dto, int userId)
        {
            var seatIds = dto.Seats.Select(x => x.SeatId).ToList();
            var seats = _context.seats.Where(x => seatIds.Contains(x.SeatId)).ToList();
            return _context.carts.Include(x => x.FilmScreening).Include(x => x.Ticket).Where(x => x.UserId == userId).Select(x => new CartDto
            {
                CartId = x.CartId,
                FilmScreeningId = x.FilmScreeningId,
                Seats = seats,
                TicketId = x.TicketId,
                Amount = x.Amount,
                TotalPrice = x.Ticket.TicketPrice * x.Amount,
            }).ToList();
        }

        public void AddToCart(CartDto dto)
        {
            using var trx = _context.Database.BeginTransaction();
            {
                var seatIds = dto.Seats.Select(x => x.SeatId).ToList();
                var seats = _context.seats.Where(x => seatIds.Contains(x.SeatId)).ToList();
                _context.carts.Add(new Cart
                {
                    UserId = dto.UserId,
                    FilmScreeningId = dto.FilmScreeningId,
                    Seats = seats,
                    TicketId = dto.TicketId,
                    Amount = dto.Amount,
                    TotalPrice = dto.TotalPrice * dto.Amount,
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

        public void UpdateCart(CartDto dto, int cartId)
        {
            var cart = _context.carts.Include(x => x.Seats).FirstOrDefault(x => x.CartId == cartId);
            if (cart == null)
            {
                throw new InvalidOperationException("Cart not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                var seatIds = dto.Seats.Select(x => x.SeatId).ToList();
                var seats = _context.seats.Where(x => seatIds.Contains(x.SeatId)).ToList();
                cart.FilmScreeningId = dto.FilmScreeningId;
                cart.TicketId = dto.TicketId;
                cart.Amount = dto.Amount;
                cart.TotalPrice = dto.TotalPrice * dto.Amount;

                cart.Seats.Clear();
                foreach (var seat in seats)
                {
                    cart.Seats.Add(seat);
                }
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void ModifyCart(int cartId, int? newAmount = null, List<int>? newSeatIds = null)
        {
            var cart = _context.carts.Include(x => x.Seats).FirstOrDefault(x => x.CartId == cartId);
            if (cart == null)
            {
                throw new InvalidOperationException("Cart not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                if (newAmount.HasValue)
                {
                    cart.Amount = newAmount.Value;
                    cart.TotalPrice = cart.Ticket.TicketPrice * newAmount.Value;
                }
                if (newSeatIds != null && newSeatIds.Any())
                {
                    cart.Seats.Clear();
                    var seats = _context.seats.Where(x => newSeatIds.Contains(x.SeatId)).ToList();
                    foreach (var seat in seats)
                    {
                        cart.Seats.Add(seat);
                    }
                }
                _context.SaveChanges();
                trx.Commit();
            }
        }

        /*  public void DeleteCart(int cartId)
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
        */

        public void ClearCart(int userId)
        {
            var carts = _context.carts.Where(x => x.UserId == userId).ToList();
            if (!carts.Any()) return;

            using var trx = _context.Database.BeginTransaction();
            {
                _context.carts.RemoveRange(carts);
                _context.SaveChanges();
                trx.Commit();
            }
        }
    }
}
