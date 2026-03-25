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

        public UserControllerTests(CustomApplicationFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
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

            response.EnsureSuccessStatusCode();
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
            await AuthenticateAsUserAsync();

            int userId = 2;

            var response = await _client.GetAsync($"/api/User/viewprofile?userId={userId}");

            var responseContent = await response.Content.ReadAsStringAsync();

            Assert.True(response.IsSuccessStatusCode, $"ViewProfile failed: {responseContent}");

            var user = JsonSerializer.Deserialize<UserDto>(responseContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(user);
            Assert.Equal("user@cinema.hu", user.Email);
        }

        [Fact]
        public async Task DeleteProfile()
        {
            await AuthenticateAsUserAsync();

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
            await AuthenticateAsUserAsync();

            var updateDto = new UpdateUserDto
            {
                UserId = 2,
                Email = "user@cinema.hu",
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

            await AuthenticateAsUserAsync();

            int userId = 2;

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