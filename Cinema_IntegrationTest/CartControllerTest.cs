using Cinema.Dto;
using Cinema_IntegrationTest;
using CinemaProject.Model;
using CinemaProject.Persistence;
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
            var request = new HttpRequestMessage(HttpMethod.Get, "/getcart?userId=2")
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
                Seats = new List<Seat> {}
            };
            var request = new HttpRequestMessage(HttpMethod.Put, "/addtocart")
            {
                Content = new StringContent(JsonSerializer.Serialize(dto),Encoding.UTF8,"application/json")
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
        public async Task RemoveFromCart_Deleteable()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var cart = db.carts
                .Include(c => c.User)
                .FirstOrDefault(c => c.User.Email == "deleteuser@cinema.hu");

            Assert.NotNull(cart);

            var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"/removefromcart?cartId={cart.CartId}");

            var response = await _client.SendAsync(request);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task UpdateCart()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = new User { Email = "testupdate@cinema.hu", Password = "pass", FullName = "Test User" };
            db.users.Add(user);
            db.SaveChanges();

            var cart = new Cart
            {
                UserId = user.UserId,
                FilmScreeningId = db.filmScreenings.First().FilmScreeningId,
                TicketId = db.tickets.First().TicketId,
                Amount = 1,
                TotalPrice = db.tickets.First().TicketPrice
            };
            db.carts.Add(cart);
            db.SaveChanges();
        }

        [Fact]
        public async Task ModifyCart()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = new User { Email = "modifycart@cinema.hu", Password = "pass", FullName = "Test User" };
            db.users.Add(user);
            db.SaveChanges();

            var ticket = db.tickets.First();
            var screening = db.filmScreenings.First();

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

            var modifyResponse = await _client.PutAsync($"/modifycart?cartId={cart.CartId}&newAmount=2", null);
            Assert.Equal(HttpStatusCode.OK, modifyResponse.StatusCode);
        }


        [Fact]
        public async Task ClearCart()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = new User { Email = "clearcart@cinema.hu", Password = "pass", FullName = "Test User" };
            db.users.Add(user);
            db.SaveChanges();

            var clearResponse = await _client.DeleteAsync($"/clearcart?userId={user.UserId}");
            Assert.Equal(HttpStatusCode.OK, clearResponse.StatusCode);
        }








    }
}