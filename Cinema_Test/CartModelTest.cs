using Cinema.Dto;
using CinemaProject.Model;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace Cinema_Test
{
    public class CartModelTest
    {
        private readonly CartModel _cartModel;
        private readonly CinemaDbContext _context;

        public CartModelTest()
        {
            _context = DbContextFactory.Create();
            DbSeeder.Seed(_context);
            _cartModel = new CartModel(_context);
        }


        // Get cart
        [Fact]
        public async Task GetCart()
        {
            var userId = 1;
            var seat = _context.seats.First();
            var dto = new CartDto
            {
                Seats = new List<Seat> { seat }
            };

            var result = await _cartModel.GetCart(dto, userId);

            Assert.NotNull(result);
        }

        [Fact]
        public async Task AddToCart()
        {
            var user = _context.users.First(u => u.Role == "User");
            var screening = _context.filmScreenings.First();
            var seat = _context.seats
                .OrderBy(s => s.SeatId)
                .First(s => s.RoomId == screening.RoomId);
            var ticket = _context.tickets.First();

            var dto = new CartDto
            {
                UserId = user.UserId,
                FilmScreeningId = screening.FilmScreeningId,
                TicketId = ticket.TicketId,
                Amount = 2,
                TotalPrice = ticket.TicketPrice,
                Seats = new List<Seat> { seat }
            };

            await _cartModel.AddToCart(dto);

            var saved = _context.carts
                .Include(c => c.Seats)
                .FirstOrDefault(c =>
                    c.UserId == user.UserId &&
                    c.FilmScreeningId == screening.FilmScreeningId);

            Assert.NotNull(saved);
            Assert.Equal(2, saved.Amount);
        }

        // REMOVE FROM CART
        [Fact]
        public async Task RemoveFromCart()
        {
            var cart = _context.carts.First();
            await _cartModel.RemoveFromCart(cart.CartId);

            Assert.False(_context.carts.Any(x => x.CartId == cart.CartId));
        }

        [Fact]
        public async Task RemoveFromCart_Wrong()
        {
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _cartModel.RemoveFromCart(99999));

            Assert.Equal("Cart not found", ex.Message);
        }

        // UPDATE CART
        [Fact]
        public async Task UpdateCart()
        {
            var cart = _context.carts.First();
            var newSeat = _context.seats.OrderBy(s => s.SeatId).Last();
            var dto = new CartDto
            {
                FilmScreeningId = cart.FilmScreeningId,
                TicketId = cart.TicketId,
                Amount = 10,
                TotalPrice = 1500,
                Seats = new List<Seat> { newSeat }
            };

            await _cartModel.UpdateCart(dto, cart.CartId);

            var updated = _context.carts.Include(c => c.Seats).First(x => x.CartId == cart.CartId);
            Assert.Equal(10, updated.Amount);
            Assert.Equal(newSeat.SeatId, updated.Seats.First().SeatId);
        }

        [Fact]
        public async Task UpdateCart_Wrong()
        {
            var dto = new CartDto { Seats = new List<Seat>() };
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _cartModel.UpdateCart(dto, 99999));

            Assert.Equal("Cart not found", ex.Message);
        }

        // MODIFY CART
        [Fact]
        public async Task ModifyCart()
        {
            var cart = _context.carts.Include(x => x.Ticket).First();
            var newSeatIds = new List<int> { _context.seats.First().SeatId };

            await _cartModel.ModifyCart(cart.CartId, newAmount: 3, newSeatIds: newSeatIds);

            var modified = _context.carts.Include(c => c.Seats).First(x => x.CartId == cart.CartId);
            Assert.Equal(3, modified.Amount);
            Assert.Equal(cart.Ticket.TicketPrice * 3, modified.TotalPrice);
            Assert.Single(modified.Seats);
        }

        [Fact]
        public async Task ModifyCart_Wrong()
        {
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _cartModel.ModifyCart(88888, newAmount: 5));

            Assert.Equal("Cart not found", ex.Message);
        }

        // CLEAR CART
        [Fact]
        public async Task ClearCart()
        {
            var userId = 1;

            _context.carts.Add(new Cart { UserId = userId, Amount = 1, TotalPrice = 100, TicketId = 1, FilmScreeningId = 1 });
            await _context.SaveChangesAsync();

            await _cartModel.ClearCart(userId);

            Assert.Empty(_context.carts.Where(x => x.UserId == userId));
        }

        [Fact]
        public async Task ClearCart_Empty()
        {
            var userId = 999;

            var exception = await Record.ExceptionAsync(async () => await _cartModel.ClearCart(userId));
            Assert.Null(exception);
        }

    }
}
