using Cinema.Dto;
using CinemaProject.Controllers;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Formats.Asn1;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Cinema_IntegrationTest
{
    public class AdminControllerTest : IClassFixture<CustomApplicationFactory>
    {
        private readonly HttpClient _client;

        public AdminControllerTest(CustomApplicationFactory factory)
        {
            _client = factory.CreateClient(
                new WebApplicationFactoryClientOptions
                {
                    AllowAutoRedirect = false
                });
        }

        private async Task AuthenticateAsAdminAsync()
        {
            var loginDto = new LoginDto
            {
                email = "admin@cinema.hu",
                password = "admin123"
            };
            var content = new StringContent(JsonSerializer.Serialize(loginDto), Encoding.UTF8, "application/json");

            var response = await _client.PostAsync("/api/User/login", content);

            response.EnsureSuccessStatusCode();
        }


        [Fact]
        public async Task GetAllUser()
        {
            await AuthenticateAsAdminAsync();

            var response = await _client.GetAsync("/getalluser");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetAllReservation()
        {
            await AuthenticateAsAdminAsync();

            var response = await _client.GetAsync("/getallreservation");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task SearchUser()
        {
            await AuthenticateAsAdminAsync();

            var response = await _client.GetAsync("/searchuser?item=Test");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task NewMovie()
        {
            var dto = new NewMovieDto
            {
                MovieTitle = "TestMovie",
                Duration = 120,
                Genre = "Action",
                Director = "Test Director",
                Description = "Test description",
                ImageId = 1,
                Status = MovieStatus.NowRunning
            };
            await AuthenticateAsAdminAsync();

            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("/newmovie", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }


        [Fact]
        public async Task NewScreening()
        {
            var dto = new NewScreeningDto
            {
                MovieId = 1,
                MovieTitle = "Inception",
                RoomId = 1,
                RoomName = "Room 1",
                Date = DateTime.UtcNow.AddDays(1)
            };
            await AuthenticateAsAdminAsync();

            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("/newscreening", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task ModifyMovie()
        {
            var dto = new MovieDto
            {
                MovieTitle = "ModifiedTitle",
                Duration = 150
            };
            await AuthenticateAsAdminAsync();

            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PutAsync("/modifymovie?movieId=1", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task ModifyFilmScreening()
        {
            var dto = new FilmScreeningDto
            {
                FilmScreeningId = 1,
                MovieId = 1,
                MovieTitle = "Inception",
                RoomId = 1,
                RoomName = "Room 1",
                Date = DateTime.UtcNow.AddDays(2)
            };
            await AuthenticateAsAdminAsync();

            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PutAsync("/modifyfilmscreening?screeningId=1", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task ModifyReservation()
        {
            var dto = new PaymentReservationDto
            {
                Amount = 1,
                IsPaid = true
            };
            await AuthenticateAsAdminAsync();

            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PutAsync("/modifyreservation?reservationId=1", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task ModifyTicket()
        {
            
            var dto = new TicketDto
            {
                TicketType = "Adult",
                TicketPrice = 3500
            };
            await AuthenticateAsAdminAsync();

            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PutAsync("/modifyticket?ticketId=1", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }















    }
}