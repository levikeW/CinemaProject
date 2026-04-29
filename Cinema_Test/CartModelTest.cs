using Cinema.Dto;
using CinemaProject.Dto;
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
                Seats = new List<SeatDto>
                {
                    new SeatDto
                    {
                        SeatId = seat.SeatId,
                        RowNumber = seat.RowNumber,
                        SeatNumber = seat.SeatNumber,
                        RoomId = seat.RoomId,
                        IsReserved = seat.IsReserved
                    }
                }
            };

            var result = await _cartModel.GetCart(userId);

            Assert.NotNull(result);
        }

        // REMOVE FROM CART
        [Fact]
        public async Task RemoveFromCart()
        {
            var ticket = _context.tickets.Include(x => x.TicketType).First(x => x.FilmScreeningId != null);

            var cart = new Cart
            {
                UserId = _context.users.First().UserId,
                FilmScreeningId = ticket.FilmScreeningId!.Value,
                TicketId = ticket.TicketId,
                Amount = 1,
                TotalPrice = ticket.TicketType.TicketPrice
            };

            _context.carts.Add(cart);
            _context.SaveChanges();

            await _cartModel.RemoveFromCart(cart.CartId);

            Assert.Null(_context.carts.FirstOrDefault(x => x.CartId == cart.CartId));
        }

        [Fact]
        public async Task RemoveFromCart_Wrong()
        {
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(async () =>
                await _cartModel.RemoveFromCart(99999));

            Assert.Equal("Cart not found", ex.Message);
        }

        // UPDATE CART
        [Fact]
        public async Task UpdateCart()
        {
            var ticket = _context.tickets.Include(x => x.TicketType).First(x => x.FilmScreeningId != null);

            var screeningId = ticket.FilmScreeningId!.Value;

            var cart = new Cart
            {
                UserId = 999,
                FilmScreeningId = screeningId,
                TicketId = ticket.TicketId,
                Amount = 1,
                TotalPrice = ticket.TicketType.TicketPrice
            };

            _context.carts.Add(cart);
            _context.SaveChanges();

            var dto = new CartDto
            {
                UserId = 999,
                FilmScreeningId = screeningId,
                TicketId = ticket.TicketId,
                Amount = 2
            };

            await _cartModel.UpdateCart(dto, cart.CartId);

            Assert.Equal(2, _context.carts.First(x => x.CartId == cart.CartId).Amount);
        }

        [Fact]
        public async Task UpdateCart_Wrong()
        {
            var dto = new CartDto { Seats = new List<SeatDto>() };
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(async () =>
                await _cartModel.UpdateCart(dto, 99999));

            Assert.Equal("Cart not found", ex.Message);
        }

        // MODIFY CART
        [Fact]
        public async Task ModifyCart()
        {
            var ticket = _context.tickets.Include(x => x.TicketType).First(x => x.FilmScreeningId != null);

            var screening = _context.filmScreenings.First(x => x.FilmScreeningId == ticket.FilmScreeningId);

            var seats = _context.seats.Where(x => x.RoomId == screening.RoomId && !x.IsReserved).Take(2).ToList();

            var cart = new Cart
            {
                UserId = _context.users.First().UserId,
                FilmScreeningId = screening.FilmScreeningId,
                TicketId = ticket.TicketId,
                Amount = 1,
                TotalPrice = ticket.TicketType.TicketPrice
            };

            _context.carts.Add(cart);
            _context.SaveChanges();

            var dto = new ModifyCartDto
            {
                CartId = cart.CartId,
                NewAmount = 2,
                NewSeatIds = seats.Select(x => x.SeatId).ToList()
            };

            await _cartModel.ModifyCart(dto);

            var updatedCart = _context.carts.First(x => x.CartId == cart.CartId);

            Assert.Equal(2, updatedCart.Amount);
        }

        [Fact]
        public async Task ModifyCart_Wrong()
        {
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(async () =>
            await _cartModel.ModifyCart(new ModifyCartDto
            {
                CartId = 88888,
                NewAmount = 5
            }));

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
