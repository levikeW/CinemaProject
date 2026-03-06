using Cinema.Dto;
using Cinema_IntegrationTest;
using CinemaProject.Dto;
using CinemaProject.Model;
using CinemaProject.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Cinema_IntegrationTest
{
    public class CartControllerTest : IClassFixture<CustomApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly CustomApplicationFactory _factory;

        public CartControllerTest(CustomApplicationFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient(
                new WebApplicationFactoryClientOptions
                {
                    AllowAutoRedirect = false
                });
        }


        [Fact]
        public async Task GetCart()
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "api/cart/getcart?userId=2")
            {
                Content = new StringContent(
                    JsonSerializer.Serialize(new CartDto()),
                    Encoding.UTF8,
                    "application/json")
            };

            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task AddToCart()
        {
            var dto = new CartDto
            {
                UserId = 2,
                FilmScreeningId = 1,
                TicketId = 2,
                Amount = 1,
                Seats = new List<SeatDto> { }
            };
            var request = new HttpRequestMessage(HttpMethod.Put, "api/cart/addtocart")
            {
                Content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json")
            };
            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task RemoveFromCart()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var cart = db.carts
                .Include(c => c.User)
                .FirstOrDefault(c => c.User.Email == "deleteuser@cinema.hu");

            Assert.NotNull(cart);
        }

        [Fact]
        public async Task UpdateCart()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = new User { Email = "updatecart@cinema.hu", Password = "pass", FullName = "Test User" };
            db.users.Add(user);
            db.SaveChanges();

            var room = new Room { RoomName = "Test Room" };
            db.rooms.Add(room);
            db.SaveChanges();

            var movie = new Movie
            {
                MovieTitle = "Test Movie",
                Duration = 120,
                Genre = "Action",
                Director = "Director",
                Description = "Test Desc",
                Image = new Image { ImageContent = new byte[] { 0x01 } },
                Status = MovieStatus.NowRunning
            };
            db.movies.Add(movie);
            db.SaveChanges();

            var screening = new FilmScreening
            {
                MovieId = movie.MovieId,
                MovieTitle = movie.MovieTitle,
                RoomId = room.RoomId,
                RoomName = room.RoomName,
                Date = DateTime.UtcNow.AddDays(1)
            };
            db.filmScreenings.Add(screening);
            db.SaveChanges();

            var ticket = new Ticket { TicketType = "Adult", TicketPrice = 1000, FilmScreeningId = screening.FilmScreeningId };
            db.tickets.Add(ticket);
            db.SaveChanges();

            var seats = new List<Seat>();
            for (int i = 1; i <= 3; i++)
                seats.Add(new Seat { RowNumber = 1, SeatNumber = i, RoomId = room.RoomId, IsReserved = false });
            db.seats.AddRange(seats);
            db.SaveChanges();

            var cart = new Cart
            {
                UserId = user.UserId,
                FilmScreeningId = screening.FilmScreeningId,
                TicketId = ticket.TicketId,
                Amount = 1,
                TotalPrice = ticket.TicketPrice
            };
            db.carts.Add(cart);
            db.SaveChanges();

            var seatDtos = seats.Select(s => new SeatDto
            {
                SeatId = s.SeatId,
                RowNumber = s.RowNumber,
                SeatNumber = s.SeatNumber,
                RoomId = s.RoomId,
                IsReserved = s.IsReserved
            }).ToList();

            var dto = new CartDto
            {
                CartId = cart.CartId,
                UserId = user.UserId,
                FilmScreeningId = screening.FilmScreeningId,
                TicketId = ticket.TicketId,
                Amount = 3,
                TotalPrice = ticket.TicketPrice,
                Seats = seatDtos
            };

            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PutAsync($"api/cart/updatecart?cartId={cart.CartId}", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var newScope = _factory.Services.CreateScope();
            var newDb = newScope.ServiceProvider.GetRequiredService<CinemaDbContext>();
            var updatedCart = newDb.carts.Include(c => c.Seats).FirstOrDefault(c => c.CartId == cart.CartId);

            Assert.NotNull(updatedCart);
            Assert.Equal(3, updatedCart.Amount);
            Assert.Equal(3, updatedCart.Seats.Count);
            Assert.All(updatedCart.Seats, s => Assert.Contains(s.SeatId, seatDtos.Select(sd => sd.SeatId)));
        }

        /*
        [Fact]
        public async Task ModifyCart()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = db.users.First(u => u.Email == "deleteuser@cinema.hu");

            var cart = db.carts
                .Include(c => c.Seats)
                .Include(c => c.Ticket)
                .FirstOrDefault(c => c.UserId == user.UserId);

            if (cart == null)
            {
                var ticket = db.tickets.First();
                cart = new Cart
                {
                    UserId = user.UserId,
                    FilmScreeningId = ticket.FilmScreeningId,
                    TicketId = ticket.TicketId,
                    Amount = 1,
                    TotalPrice = ticket.TicketPrice
                };
                db.carts.Add(cart);
                db.SaveChanges();
            }

            var availableSeats = db.seats.Where(s => !s.IsReserved).Take(2).ToList();
            foreach (var seat in availableSeats)
                seat.IsReserved = false;

            db.SaveChanges();

            var dto = new ModifyCartDto
            {
                CartId = cart.CartId,
                NewAmount = 2,
                NewSeatIds = availableSeats.Select(s => s.SeatId).ToList()
            };

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _client.PutAsync("/api/cart/modifycart", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var updatedCart = db.carts
                .Include(c => c.Seats)
                .Include(c => c.Ticket)
                .First(c => c.CartId == cart.CartId);

            Assert.NotNull(updatedCart);
            Assert.Equal(2, updatedCart.Amount);
            Assert.Equal(dto.NewSeatIds.Count, updatedCart.Seats.Count);
            Assert.All(updatedCart.Seats, s => Assert.Contains(s.SeatId, dto.NewSeatIds));
            Assert.All(updatedCart.Seats, s => Assert.True(s.IsReserved));
        }
        */



        [Fact]
        public async Task ClearCart()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = new User { Email = "clearcart@cinema.hu", Password = "pass", FullName = "Test User" };
            db.users.Add(user);
            db.SaveChanges();

            var clearResponse = await _client.DeleteAsync($"api/cart/clearcart?userId={user.UserId}");
            Assert.Equal(HttpStatusCode.OK, clearResponse.StatusCode);
        }








    }
}