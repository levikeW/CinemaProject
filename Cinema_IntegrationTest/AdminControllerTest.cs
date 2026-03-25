using Cinema.Dto;
using CinemaProject.Controllers;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
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
        private readonly CustomApplicationFactory _factory;

        public AdminControllerTest(CustomApplicationFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient(
                new WebApplicationFactoryClientOptions
                {
                    AllowAutoRedirect = false
                });
        }
        /* [Fact]
         private async Task AuthenticateAsAdminAsync()
         {
             var loginDto = new LoginDto
             {
                 email = "admin2@cinema.hu",
                 password = "admin1234"
             };
             var content = new StringContent(JsonSerializer.Serialize(loginDto), Encoding.UTF8, "application/json");

             var response = await _client.PostAsync("/api/User/login", content);

             response.EnsureSuccessStatusCode();
             Assert.Equal(HttpStatusCode.OK, response.StatusCode);
             var body = await response.Content.ReadAsStringAsync();

             var result = JsonSerializer.Deserialize<UserDto>(
                 body,
                 new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

             Assert.Equal("Admin", result.Role);
         }*/
        private string? _authCookie;

        private async Task AuthenticateAsAdminAsync()
        {
            var loginDto = new LoginDto
            {
                email = "admin2@cinema.hu",
                password = "admin1234"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(loginDto),
                Encoding.UTF8,
                "application/json");

            var response = await _client.PostAsync("/api/User/login", content);
            var body = await response.Content.ReadAsStringAsync();

            Assert.True(response.IsSuccessStatusCode, $"Login failed: {body}");

            Assert.True(
                response.Headers.TryGetValues("Set-Cookie", out var cookies),
                $"Login succeeded, but no auth cookie was issued. Body: {body}");

            _authCookie = cookies
                .Select(c => c.Split(';')[0])
                .FirstOrDefault();

            Assert.False(string.IsNullOrWhiteSpace(_authCookie), "Auth cookie was empty.");
        }
        private void AddAuthCookie()
        {
            _client.DefaultRequestHeaders.Remove("Cookie");

            if (!string.IsNullOrWhiteSpace(_authCookie))
            {
                _client.DefaultRequestHeaders.Add("Cookie", _authCookie);
            }
        }

        [Fact]
        public async Task GetAllUser()
        {
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            var response = await _client.GetAsync("api/admin/getalluser");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetAllReservation()
        {
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            var response = await _client.GetAsync("api/admin/getallreservation");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task SearchUser()
        {
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            var response = await _client.GetAsync("api/admin/searchuser?item=user");
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
            AddAuthCookie();
            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("api/admin/newmovie", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }


        [Fact]
        public async Task NewScreening()
        {
            var dto = new NewScreeningDto
            {
                MovieTitle = "Inception",
                RoomId = 1,
                RoomName = "Room 1",
                Date = DateTime.UtcNow.AddDays(1)
            };
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PostAsync("api/admin/newscreening", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task ModifyMovie_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();


            int id = db.movies.First().MovieId;
            var dto = new MovieDto
            {
                MovieId = id,
                MovieTitle = "ModifiedTitle",
                Duration = 150,
                Genre = "asd",
                Director = "asd",
                Description = "asd",
                ImageId = 1
            };

            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PutAsync($"api/admin/modifymovie", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

 
        }
        [Fact]
        public async Task ModifyFilmScreening_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var testScreening = new FilmScreening
            {
                MovieId = db.movies.First().MovieId,
                RoomId = db.rooms.First().RoomId,
                RoomName = db.rooms.First().RoomName,
                Date = DateTime.UtcNow.AddDays(1)
            };
            db.filmScreenings.Add(testScreening);
            db.SaveChanges();
        }







        [Fact]
        public async Task DeleteUser_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = db.users.First(x => x.Email == "user@cinema.hu");

            var response = await _client.DeleteAsync($"api/admin/deleteuser?userId={user.UserId}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var deletedUser = db.users.FirstOrDefault(x => x.UserId == user.UserId);
            Assert.Null(deletedUser);
        }

        [Fact]
        public async Task DeleteMovie_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var movie = db.movies.First(x => x.MovieTitle == "Gladiator");

            var response = await _client.DeleteAsync(
                $"api/admin/deletemovie?movieId={movie.MovieId}"
            );
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        [Fact]
        public async Task DeleteMovie_ShouldReturnNotFound()
        {
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            var response = await _client.DeleteAsync(
                $"api/admin/deletemovie?movieId={66}"
            );
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        }

        [Fact]
        public async Task DeleteScreening_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var movies = db.movies.First(x => x.MovieTitle == "Gladiator");
            var screening = db.filmScreenings
                .First(x => x.MovieId == movies.MovieId);

            var response = await _client.DeleteAsync(
                $"api/admin/deletescreening?screeningId={screening.FilmScreeningId}"
            );
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var deletedScreening = db.filmScreenings
                .FirstOrDefault(s => s.FilmScreeningId == screening.FilmScreeningId);
            Assert.Null(deletedScreening);
        }

        [Fact]
        public async Task DeleteReservation_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var reservation = db.paymentReservations.First();

            var response = await _client.DeleteAsync(
                $"api/admin/deletereservation?reservationId={reservation.PaymentReservationId}"
            );
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var deletedReservation = db.paymentReservations
                .FirstOrDefault(r => r.PaymentReservationId == reservation.PaymentReservationId);
            Assert.Null(deletedReservation);
        }

        [Fact]
        public async Task DeleteImage_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();
            AddAuthCookie();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var freeImage = new Image { ImageContent = new byte[] { 0xFE } };
            db.images.Add(freeImage);
            db.SaveChanges();

            var response = await _client.DeleteAsync(
                $"api/admin/deleteimage?imageId={freeImage.ImageId}"
            );
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var deletedImage = db.images.FirstOrDefault(i => i.ImageId == freeImage.ImageId);
            Assert.Null(deletedImage);
        }

    }
}