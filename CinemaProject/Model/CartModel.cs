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

        public async Task<IEnumerable<CartDto>> GetCart(int userId)
        {
            var carts = await _context.carts
                .Include(x => x.FilmScreening)
                .Include(x => x.Ticket)
                    .ThenInclude(x => x.TicketType)
                .Include(x => x.Seats)
                .Where(x => x.UserId == userId)
                .Where(x => !_context.paymentReservations.Any(p => p.CartId == x.CartId))
                .Select(x => new CartDto
                {
                    CartId = x.CartId,
                    UserId = x.UserId,
                    FilmScreeningId = x.FilmScreeningId,
                    TicketId = x.TicketId,
                    Amount = x.Amount,
                    TotalPrice = x.Ticket.TicketType.TicketPrice * x.Amount,
                    Seats = x.Seats.Select(s => new SeatDto
                    {
                        SeatId = s.SeatId,
                        RowNumber = s.RowNumber,
                        SeatNumber = s.SeatNumber,
                        RoomId = s.RoomId,
                        IsReserved = s.IsReserved
                    }).ToList()
                }).ToListAsync();

            return carts;
        }

        public async Task<CartDto> AddToCart(CartDto dto)
        {
            using var trx = await _context.Database.BeginTransactionAsync();

            var seatIds = dto.Seats.Select(x => x.SeatId).ToList();

            var seats = await _context.seats.Where(s => seatIds.Contains(s.SeatId)).ToListAsync();

            if (seats.Count != seatIds.Count)
                throw new InvalidOperationException("One or more seats were not found");

            var ticket = await _context.tickets
                .Include(t => t.TicketType)
                .FirstOrDefaultAsync(t => t.TicketId == dto.TicketId);

            if (ticket == null)
                throw new InvalidOperationException("Ticket not found");

            if (ticket.TicketType == null)
                throw new InvalidOperationException("Ticket type not found");

            if (ticket.FilmScreeningId != dto.FilmScreeningId)
                throw new InvalidOperationException("Ticket does not belong to the selected screening");

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
                TotalPrice = ticket.TicketType.TicketPrice * dto.Amount,
                Seats = seats
            };
            var conflictingSeatIds = await _context.carts.Where(c => c.FilmScreeningId == dto.FilmScreeningId).SelectMany(c => c.Seats.Select(s => s.SeatId)).Where(seatId => seatIds.Contains(seatId)).Distinct().ToListAsync();

            if (conflictingSeatIds.Any())
                throw new InvalidOperationException("One or more selected seats are already reserved");

            _context.carts.Add(cart);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();

            return new CartDto
            {
                CartId = cart.CartId,
                UserId = cart.UserId,
                FilmScreeningId = cart.FilmScreeningId,
                TicketId = cart.TicketId,
                Amount = cart.Amount,
                TotalPrice = cart.TotalPrice,
                Seats = seats.Select(s => new SeatDto
                {
                    SeatId = s.SeatId,
                    RowNumber = s.RowNumber,
                    SeatNumber = s.SeatNumber,
                    RoomId = s.RoomId,
                    IsReserved = s.IsReserved
                }).ToList()
            };
        }

        public async Task RemoveFromCart(int cartId)
        {
            if (await _context.paymentReservations.AnyAsync(x => x.CartId == cartId))
                throw new InvalidOperationException("This cart already belongs to a reservation.");

            var cart = await _context.carts.Include(x => x.Seats).FirstOrDefaultAsync(x => x.CartId == cartId);

            if (cart == null)
                throw new InvalidOperationException("Cart not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            foreach (var seat in cart.Seats)
            {
                seat.CartId = null;
                seat.IsReserved = false;
            }

            _context.carts.Remove(cart);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task UpdateCart(CartDto dto, int cartId)
        {
            if (await _context.paymentReservations.AnyAsync(x => x.CartId == cartId))
                throw new InvalidOperationException("This cart already belongs to a reservation.");

            var cart = await _context.carts
                .Include(x => x.Seats)
                .Include(x => x.Ticket)
                    .ThenInclude(x => x.TicketType)
                .FirstOrDefaultAsync(x => x.CartId == cartId);

            if (cart == null)
                throw new InvalidOperationException("Cart not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            var seatIds = dto.Seats.Select(x => x.SeatId).ToList();

            var seats = await _context.seats.Where(x => seatIds.Contains(x.SeatId)).ToListAsync();

            if (seats.Count != seatIds.Count)
                throw new InvalidOperationException("One or more seats were not found");

            var ticket = await _context.tickets
                .Include(t => t.TicketType)
                .FirstOrDefaultAsync(t => t.TicketId == dto.TicketId);

            if (ticket == null)
                throw new InvalidOperationException("Ticket not found");

            if (ticket.TicketType == null)
                throw new InvalidOperationException("Ticket type not found");

            if (ticket.FilmScreeningId != dto.FilmScreeningId)
                throw new InvalidOperationException("Ticket does not belong to the selected screening");

            foreach (var oldSeat in cart.Seats)
            {
                oldSeat.CartId = null;
                oldSeat.IsReserved = false;
            }

            cart.Seats.Clear();

            cart.FilmScreeningId = dto.FilmScreeningId;
            cart.TicketId = dto.TicketId;
            cart.Amount = dto.Amount;
            cart.TotalPrice = ticket.TicketType.TicketPrice * dto.Amount;

            foreach (var seat in seats)
            {
                seat.CartId = cart.CartId;
                seat.IsReserved = true;
                cart.Seats.Add(seat);
            }

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task ModifyCart(ModifyCartDto dto)
        {
            if (await _context.paymentReservations.AnyAsync(x => x.CartId == dto.CartId))
                throw new InvalidOperationException("This cart already belongs to a reservation.");

            var cart = await _context.carts
                .Include(x => x.Seats)
                .Include(x => x.Ticket)
                    .ThenInclude(x => x.TicketType)
                .FirstOrDefaultAsync(x => x.CartId == dto.CartId);

            if (cart == null)
                throw new InvalidOperationException("Cart not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            if (dto.NewAmount > 0)
            {
                if (cart.Ticket == null || cart.Ticket.TicketType == null)
                    throw new InvalidOperationException("Ticket type not found");

                cart.Amount = dto.NewAmount;
                cart.TotalPrice = cart.Ticket.TicketType.TicketPrice * dto.NewAmount;
            }

            if (dto.NewSeatIds != null && dto.NewSeatIds.Any())
            {
                foreach (var oldSeat in cart.Seats)
                {
                    oldSeat.CartId = null;
                    oldSeat.IsReserved = false;
                }

                cart.Seats.Clear();

                var seats = await _context.seats.Where(s => dto.NewSeatIds.Contains(s.SeatId)).ToListAsync();

                foreach (var seat in seats)
                {
                    seat.CartId = cart.CartId;
                    seat.IsReserved = true;
                    cart.Seats.Add(seat);
                }
            }

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task ClearCart(int userId)
        {
            var carts = await _context.carts
                .Include(x => x.Seats)
                .Where(x => x.UserId == userId)
                .Where(x => !_context.paymentReservations.Any(p => p.CartId == x.CartId))
                .ToListAsync();

            if (!carts.Any())
                return;

            using var trx = await _context.Database.BeginTransactionAsync();

            foreach (var cart in carts)
            {
                foreach (var seat in cart.Seats)
                {
                    seat.CartId = null;
                    seat.IsReserved = false;
                }
            }

            _context.carts.RemoveRange(carts);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }
    }
}