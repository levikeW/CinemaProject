using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace Cinema_IntegrationTest
{
    public class UserControllerTests : IClassFixture<CustomApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly CustomApplicationFactory _factory;
        private string? _authCookie;

        public UserControllerTests(CustomApplicationFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient(
                new WebApplicationFactoryClientOptions
                {
                    AllowAutoRedirect = false
                });
        }

        private async Task AuthenticateAsUserAsync()
        {
            var loginDto = new LoginDto
            {
                email = "user@cinema.hu",
                password = "user123"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(loginDto),
                Encoding.UTF8,
                "application/json"
            );

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

        private async Task<int> CreateAndAuthenticateUserAsync()
        {
            var email = $"testuser_{Guid.NewGuid():N}@cinema.hu";
            var password = "user123";

            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
                db.users.Add(new User
                {
                    Email = email,
                    Password = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(password))),
                    FullName = "Integration Test User",
                    BillingAddress = "Test Address",
                    Role = "User"
                });
                db.SaveChanges();
            }

            var loginDto = new LoginDto
            {
                email = email,
                password = password
            };

            var content = new StringContent(
                JsonSerializer.Serialize(loginDto),
                Encoding.UTF8,
                "application/json"
            );

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

            using var verifyScope = _factory.Services.CreateScope();
            var verifyDb = verifyScope.ServiceProvider.GetRequiredService<CinemaDbContext>();
            return verifyDb.users.First(x => x.Email == email).UserId;
        }

        [Fact]
        public async Task RegisterUser()
        {
            var newUserDto = new UserDto
            {
                Email = "testuser@test.com",
                Password = "123456",
                FullName = "Test User",
                BillingAddress = "Budapest 10"
            };

            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
            var json = JsonSerializer.Serialize(newUserDto, jsonOptions);

            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _client.PostAsync("/api/user/regist?IsAdmin=false", content);

            var responseContent = await response.Content.ReadAsStringAsync();
            Assert.True(response.IsSuccessStatusCode, $"RegisterUser failed: {responseContent}");
        }

        [Fact]
        public async Task LoginUser()
        {
            var dto = new LoginDto
            {
                email = "testuser@test.com",
                password = "123456"
            };

            var json = JsonSerializer.Serialize(dto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _client.PostAsync("/api/user/login", content);

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.Unauthorized
            );
        }

        [Fact]
        public async Task Logout()
        {
            var response = await _client.PostAsync("/api/user/logout", null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetMyData()
        {
            var response = await _client.GetAsync("/api/user/getmydata");

            Assert.True(
                response.StatusCode == HttpStatusCode.OK ||
                response.StatusCode == HttpStatusCode.Unauthorized
            );
        }


        [Fact]
        public async Task ViewProfile()
        {
            var userId = await CreateAndAuthenticateUserAsync();
            AddAuthCookie();

            var response = await _client.GetAsync($"/api/User/viewprofile?userId={userId}");

            var responseContent = await response.Content.ReadAsStringAsync();

            Assert.True(response.IsSuccessStatusCode, $"ViewProfile failed: {responseContent}");

            var user = JsonSerializer.Deserialize<UserDto>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(user);
            Assert.Equal(userId, user.UserId);
        }

        [Fact]
        public async Task DeleteProfile()
        {
            var loggedInUserId = await CreateAndAuthenticateUserAsync();
            AddAuthCookie();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

            var testUser = new User
            {
                Email = $"deleteuser_{Guid.NewGuid()}@cinema.hu",
                Password = "user123",
                FullName = "Delete User",
                BillingAddress = "Test Address",
                Role = "User"
            };
            db.users.Add(testUser);
            db.SaveChanges();

            var response = await _client.DeleteAsync($"/api/User/deleteprofile?userId={testUser.UserId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var deletedUser = db.users.FirstOrDefault(u => u.UserId == testUser.UserId);
            Assert.Null(deletedUser);
        }

        [Fact]
        public async Task UpdateProfile()
        {
            var userId = await CreateAndAuthenticateUserAsync();
            AddAuthCookie();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
            var currentUser = db.users.First(x => x.UserId == userId);

            var updateDto = new UpdateUserDto
            {
                UserId = userId,
                Email = currentUser.Email,
                FullName = "Updated User",
                BillingAddress = "Debrecen 9"
            };

            var content = new StringContent(JsonSerializer.Serialize(updateDto), Encoding.UTF8, "application/json");

            var response = await _client.PutAsync("/api/User/updateprofile", content);

            var responseContent = await response.Content.ReadAsStringAsync();

            Assert.True(response.IsSuccessStatusCode, $"UpdateProfile failed: {responseContent}");
        }

        [Fact]
        public async Task ChangePassword()
        {
            var userId = await CreateAndAuthenticateUserAsync();
            AddAuthCookie();

            string oldPass = "user123";
            string newPass = "newpassword123";

            var response = await _client.PutAsync(
                $"/api/User/changepass?userId={userId}&oldPass={Uri.EscapeDataString(oldPass)}&newPass={Uri.EscapeDataString(newPass)}",
                null);

            var content = await response.Content.ReadAsStringAsync();

            Assert.True(response.IsSuccessStatusCode, $"ChangePassword failed: {content}");
        }
    }
}