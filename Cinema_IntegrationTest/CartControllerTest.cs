using Cinema.Dto;
using Cinema_IntegrationTest;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Text;
using System.Text.Json;

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
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = db.users.First();
            var screening = db.filmScreenings.First();
            var ticket = db.tickets.First(x => x.FilmScreeningId == screening.FilmScreeningId);
            var seat = db.seats.First(x => x.RoomId == screening.RoomId && !x.IsReserved);

            var dto = new CartDto
            {
                UserId = user.UserId,
                FilmScreeningId = screening.FilmScreeningId,
                TicketId = ticket.TicketId,
                Amount = 1,
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

            var content = new StringContent(
                JsonSerializer.Serialize(dto),
                Encoding.UTF8,
                "application/json");

            var response = await _client.PutAsync("api/cart/addtocart", content);
            var body = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.False(string.IsNullOrWhiteSpace(body));
        }

        [Fact]
        public async Task RemoveFromCart()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = db.users.First();
            var screening = db.filmScreenings.First();
            var ticket = db.tickets.First(x => x.FilmScreeningId == screening.FilmScreeningId);
            var seat = db.seats.First(x => x.RoomId == screening.RoomId && !x.IsReserved);

            var cart = new Cart
            {
                UserId = user.UserId,
                FilmScreeningId = screening.FilmScreeningId,
                TicketId = ticket.TicketId,
                Amount = 1,
                TotalPrice = 3000,
                Seats = new List<Seat> { seat }
            };
            seat.IsReserved = true;
            db.carts.Add(cart);
            db.SaveChanges();

            var response = await _client.PostAsync($"/api/cart/removefromcart?cartId={cart.CartId}", null);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task UpdateCart()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = new User { Email = $"updatecart_{Guid.NewGuid():N}@cinema.hu", Password = "pass", FullName = "Test User" };
            db.users.Add(user);
            db.SaveChanges();

            var room = new Room { RoomName = "Test Room" };
            db.rooms.Add(room);
            db.SaveChanges();

            var image = new Image { ImageContent = new byte[] { 0x01 } };
            db.images.Add(image);
            db.SaveChanges();

            var movie = new Movie
            {
                MovieTitle = $"Test Movie {Guid.NewGuid():N}",
                Duration = 120,
                Genre = "Action",
                Director = "Director",
                Description = "Test Desc",
                ImageId = image.ImageId,
                Status = MovieStatus.NowRunning
            };
            db.movies.Add(movie);
            db.SaveChanges();

            var screening = new FilmScreening
            {
                MovieId = movie.MovieId,
                RoomId = room.RoomId,
                RoomName = room.RoomName,
                Date = DateTime.UtcNow.AddDays(1)
            };
            db.filmScreenings.Add(screening);
            db.SaveChanges();

            var ticketType = new TicketTypes { TicketType = "Test", TicketPrice = 2500 };
            db.ticketTypes.Add(ticketType);
            db.SaveChanges();

            var ticket = new Ticket { TicketTypeId = ticketType.TicketTypeId, FilmScreeningId = screening.FilmScreeningId };
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
                TotalPrice = ticketType.TicketPrice
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
                TotalPrice = ticketType.TicketPrice,
                Seats = seatDtos
            };

            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PutAsync($"api/cart/updatecart?cartId={cart.CartId}", content);
            var body = await response.Content.ReadAsStringAsync();
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.False(string.IsNullOrWhiteSpace(body));
        }

        [Fact]
        public async Task ModifyCart()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = db.users.First();
            var screening = db.filmScreenings.First();
            var ticket = db.tickets.Include(x => x.TicketType).First(x => x.FilmScreeningId == screening.FilmScreeningId);
            var availableSeats = db.seats.Where(s => s.RoomId == screening.RoomId && !s.IsReserved).Take(2).ToList();

            var cart = new Cart
            {
                UserId = user.UserId,
                FilmScreeningId = screening.FilmScreeningId,
                TicketId = ticket.TicketId,
                Amount = 1,
                TotalPrice = ticket.TicketType.TicketPrice
            };
            db.carts.Add(cart);
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
            var body = await response.Content.ReadAsStringAsync();
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.False(string.IsNullOrWhiteSpace(body));
        }

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