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
        public async Task<IEnumerable<CartDto>> GetCart(CartDto dto, int userId)
        {
            var seatIds = dto.Seats.Select(x => x.SeatId).ToList();
            var seatDtos = dto.Seats.Select(s => new SeatDto
            {
                SeatId = s.SeatId,
                RowNumber = s.RowNumber,
                SeatNumber = s.SeatNumber,
                RoomId = s.RoomId,
                IsReserved = s.IsReserved
            }).ToList(); return _context.carts.Include(x => x.FilmScreening).Include(x => x.Ticket).Where(x => x.UserId == userId).Select(x => new CartDto
            {
                CartId = x.CartId,
                FilmScreeningId = x.FilmScreeningId,
                Seats = seatDtos,
                TicketId = x.TicketId,
                Amount = x.Amount,
                TotalPrice = x.Ticket.TicketPrice * x.Amount,
            }).ToList();
        }

        public async Task AddToCart(CartDto dto)
        {
            using var trx = await _context.Database.BeginTransactionAsync();

            var seatIds = dto.Seats.Select(x => x.SeatId).ToList();
            var seats = await _context.seats
                .Where(s => seatIds.Contains(s.SeatId))
                .ToListAsync();

            foreach (var seat in seats)
            {
                seat.IsReserved = true;
            }

            var cart = new Cart
            {
                UserId = dto.UserId,
                FilmScreeningId = dto.FilmScreeningId,
                TicketId = dto.TicketId,
                Amount = dto.Amount,
                TotalPrice = dto.TotalPrice * dto.Amount,
                Seats = seats
            };

            _context.carts.Add(cart);
            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task RemoveFromCart(int cartId)
        {
            if (!_context.carts.Any(x => x.CartId == cartId))
            {
                throw new InvalidOperationException("Cart not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                _context.carts.Remove(_context.carts.Where(x => x.CartId == cartId).First());
                await _context.SaveChangesAsync();
                await trx.CommitAsync();
            }
        }

        public async Task UpdateCart(CartDto dto, int cartId)
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
                await _context.SaveChangesAsync();
                await trx.CommitAsync();
            }
        }

        public async Task ModifyCart(ModifyCartDto dto)
        {
            var cart = _context.carts.Include(x => x.Seats).FirstOrDefault(x => x.CartId == dto.CartId);

            if (cart == null)
                throw new InvalidOperationException("Cart not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            if (dto.NewAmount > 0)
            {
                cart.Amount = dto.NewAmount;
                cart.TotalPrice = cart.Ticket.TicketPrice * dto.NewAmount;
            }

            if (dto.NewSeatIds != null && dto.NewSeatIds.Any())
            {
                cart.Seats.Clear();
                var seats = _context.seats.Where(s => dto.NewSeatIds.Contains(s.SeatId)).ToList();

                foreach (var seat in seats)
                {
                    cart.Seats.Add(seat);
                    seat.IsReserved = true;
                }
            }

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
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

        public async Task ClearCart(int userId)
        {
            var carts = _context.carts.Where(x => x.UserId == userId).ToList();
            if (!carts.Any()) return;

            using var trx = _context.Database.BeginTransaction();
            {
                _context.carts.RemoveRange(carts);
                await _context.SaveChangesAsync();
                await trx.CommitAsync();
            }
        }
    }
}
