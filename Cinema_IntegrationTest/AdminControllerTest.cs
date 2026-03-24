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


/*namespace Cinema_IntegrationTest
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

            var response = await _client.GetAsync("api/admin/getalluser");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetAllReservation()
        {
            await AuthenticateAsAdminAsync();

            var response = await _client.GetAsync("api/admin/getallreservation");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task SearchUser()
        {
            await AuthenticateAsAdminAsync();

            var response = await _client.GetAsync("api/admin/searchuser?item=Test");
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
            var response = await _client.PostAsync("api/admin/newmovie", content);
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
            var response = await _client.PostAsync("api/admin/newscreening", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task ModifyMovie_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var testMovie = new Movie
            {
                MovieTitle = "OriginalTitle",
                Duration = 120,
                Genre = "Test",
                Director = "Test Director",
                Description = "Test Movie",
                ImageId = db.images.First().ImageId,
                Status = MovieStatus.NowRunning
            };
            db.movies.Add(testMovie);
            db.SaveChanges();
        }

            /*var dto = new MovieDto
            {
                MovieId = testMovie.MovieId,
                MovieTitle = "ModifiedTitle",
                Duration = 150,
                Genre = testMovie.Genre,
                Director = testMovie.Director,
                Description = testMovie.Description,
                ImageId = testMovie.ImageId
            };

            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PutAsync($"/modifymovie?movieId={testMovie.MovieId}", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var updatedMovie = db.movies.First(m => m.MovieId == testMovie.MovieId);
            Assert.Equal(dto.MovieTitle, updatedMovie.MovieTitle);
            Assert.Equal(dto.Duration, updatedMovie.Duration); /

        [Fact]
        public async Task ModifyFilmScreening_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var testScreening = new FilmScreening
            {
                MovieId = db.movies.First().MovieId,
                MovieTitle = db.movies.First().MovieTitle,
                RoomId = db.rooms.First().RoomId,
                RoomName = db.rooms.First().RoomName,
                Date = DateTime.UtcNow.AddDays(1)
            };
            db.filmScreenings.Add(testScreening);
            db.SaveChanges();
        }



        /*var dto = new FilmScreeningDto
        {
            FilmScreeningId = testScreening.FilmScreeningId,
            MovieId = testScreening.MovieId,
            MovieTitle = testScreening.MovieTitle,
            RoomId = testScreening.RoomId,
            RoomName = testScreening.RoomName,
            Date = DateTime.UtcNow.AddDays(2)
        };

        var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
        var response = await _client.PutAsync($"/modifyfilmscreening?screeningId={testScreening.FilmScreeningId}", content);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updatedScreening = db.filmScreenings.First(s => s.FilmScreeningId == testScreening.FilmScreeningId);
        Assert.Equal(dto.Date, updatedScreening.Date); /

        [Fact]
        public async Task ModifyReservation_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var testUser = db.users.First(u => u.Role == "User");
            var testScreening = db.filmScreenings.First();
            var testTicket = db.tickets.First();

            var testCart = new Cart
            {
                UserId = testUser.UserId,
                FilmScreeningId = testScreening.FilmScreeningId,
                TicketId = testTicket.TicketId,
                Amount = 2,
                TotalPrice = 2 * testTicket.TicketPrice
            };
            db.carts.Add(testCart);
            db.SaveChanges();
        }

            /*var testReservation = new PaymentReservation
            {
                CartId = testCart.CartId,
                FilmScreeningId = testScreening.FilmScreeningId,
                UserId = testUser.UserId,
                Amount = testCart.Amount,
                Date = DateTime.UtcNow,
                IsPaid = false
            };
            db.paymentReservations.Add(testReservation);
            db.SaveChanges();

            var dto = new PaymentReservationDto
            {
                PaymentReservationId = testReservation.PaymentReservationId,
                UserId = testUser.UserId,
                FilmScreeningId = testScreening.FilmScreeningId,
                Amount = 5,
                IsPaid = true,
                Price = testTicket.TicketPrice,
                Seats = new List<SeatDto>()
            };

            var content = new StringContent(JsonSerializer.Serialize(dto), Encoding.UTF8, "application/json");
            var response = await _client.PutAsync($"/modifyreservation?reservationId={testReservation.PaymentReservationId}", content);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var updatedReservation = db.paymentReservations
                .Include(r => r.Cart)
                .First(r => r.PaymentReservationId == testReservation.PaymentReservationId);

            Assert.Equal(dto.Amount, updatedReservation.Amount);
            Assert.Equal(dto.IsPaid, updatedReservation.IsPaid);
            Assert.Equal(dto.Price * dto.Amount, updatedReservation.Cart.TotalPrice); /


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
            var response = await _client.PutAsync("api/admin/modifyticket?ticketId=1", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }


        [Fact]
        public async Task DeleteUser_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var user = db.users.First(x => x.Email == "deleteuser@cinema.hu");

            var response = await _client.DeleteAsync($"api/admin/deleteuser?userId={user.UserId}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var deletedUser = db.users.FirstOrDefault(x => x.UserId == user.UserId);
            Assert.Null(deletedUser);
        }

        [Fact]
        public async Task DeleteMovie_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var movie = db.movies.First(x=> x.MovieTitle == "DeleteMovie");

            var response = await _client.DeleteAsync(
                $"api/admin/deletemovie?movieId={movie.MovieId}"
            );
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        [Fact]
        public async Task DeleteMovie_ShouldReturnNotFound()
        {
            await AuthenticateAsAdminAsync();

            var response = await _client.DeleteAsync(
                $"api/admin/deletemovie?movieId={66}"
            );
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        }

        [Fact]
        public async Task DeleteScreening_ShouldReturnOk()
        {
            await AuthenticateAsAdminAsync();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var screening = db.filmScreenings
                .First(x => x.MovieTitle == "DeleteMovie");

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
}*/