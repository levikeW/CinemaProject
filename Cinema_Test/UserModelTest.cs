using CinemaProject.Dto;
using CinemaProject.Model;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Cinema_Test
{
    public class UserModelTest
    {
        private readonly UserModel _userModel;
        private readonly CinemaDbContext _context;

        public UserModelTest()
        {
            _context = DbContextFactory.Create();
            DbSeeder.Seed(_context);
            _userModel = new UserModel(_context);
        }
        private string HashPass(string password)
        {
            using var Sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = Sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }


        // ValidateUser
        [Fact]
        public async Task ValidateUser()
        {
            var dto = new LoginDto { email = "user@cinema.hu", password = "user123" };
            var user = await Task.Run(() => _userModel.ValidateUser(dto));

            Assert.NotNull(user);
            Assert.Equal("Test User", user.FullName);
            Assert.Equal("User", user.Role);
        }
        [Fact]
        public async Task ValidateUser_WrongPassword()
        {
            var dto = new LoginDto { email = "user@cinema.hu", password = "wrongpassword" };
            var hash = HashPass(dto.password);
            var user = await Task.Run(() => _userModel.ValidateUser(new LoginDto { email = dto.email, password = hash }));

            Assert.Null(user);
        }
        [Fact]
        public async Task ValidateUser_WrongEmail()
        {
            var dto = new LoginDto { email = "wrong@cinema.hu", password = "user123" };
            var hash = HashPass(dto.password);
            var user = await Task.Run(() => _userModel.ValidateUser(new LoginDto { email = dto.email, password = hash }));

            Assert.Null(user);
        }

        // Regist
        [Fact]
        public async Task RegistValidate()
        {
            var dto = new RegistDto
            {
                Email = "asd@gmail.com",
                Password = "regist123",
                FullName = "Asd Elek"
            };

            await _userModel.Regist(dto);

            var user = _context.users.FirstOrDefault(x => x.Email == "asd@gmail.com");

            Assert.NotNull(user);
            Assert.Equal("asd@gmail.com", user.Email);
            Assert.Equal(HashPass("regist123"), user.Password);
        }

        [Fact]
        public async Task RegistValidate_Wrong()
        {
            var dto1 = new RegistDto
            {
                Email = "asd@gmail.com",
                Password = "regist123",
                FullName = "Asd Elek"
            };

            await _userModel.Regist(dto1);

            var dto2 = new RegistDto
            {
                Email = "asd@gmail.com",
                Password = "anotherPass",
                FullName = "Duplicate User"
            };

            var ex = await Record.ExceptionAsync(async () =>
            {
                await _userModel.Regist(dto2);
            });

            Assert.NotNull(ex);
            Assert.IsType<InvalidOperationException>(ex);
        }

        // ViewProfile
        [Fact]
        public async Task ViewProfile()
        {
            var user = _context.users.First(x => x.Email == "admin@cinema.hu");

            var dto = await Task.Run(() => _userModel.ViewProfile(user.UserId));

            Assert.NotNull(dto);
            Assert.Equal(user.UserId, dto.UserId);
            Assert.Equal("admin@cinema.hu", dto.Email);
            Assert.Equal("Admin User", dto.FullName);
        }
        [Fact]
        public async Task ViewProfile_Wrong()
        {
            var dto = await _userModel.ViewProfile(99999);
            Assert.Null(dto);
        }

        // DeleteProfile
        [Fact]
        public async Task Delete()
        {
            _userModel.DeleteProfile(1);

            Assert.False(_context.users.Any(x => x.UserId == 1));
        }
        [Fact]
        public async Task Delete_Wrong()
        {
            var ex = await Record.ExceptionAsync(async () =>
            {
                await Task.Run(() => _userModel.DeleteProfile(99999));
            });

            Assert.NotNull(ex);
            Assert.IsType<KeyNotFoundException>(ex);
        }

        // UpdateProfile
        [Fact]
        public async Task Update()
        {
            var updatedUser = _context.users.FirstOrDefault(x => x.UserId == 1);
            await _userModel.UpdateProfile(new CinemaProject.Dto.UpdateUserDto { Email = "admin3@cinema.hu",UserId =  updatedUser.UserId, FullName = "Admin User3", BillingAddress = "Budapest 3." });
            var user = _context.users.FirstOrDefault(x => x.UserId == 1);
            Assert.Equal("admin3@cinema.hu", user.Email);
            Assert.Equal("Admin User3", user.FullName);
            Assert.Equal("Budapest 3.", user.BillingAddress);
        }
        [Fact]
        public async Task Update_Wrong()
        {
            var ex = await Record.ExceptionAsync(async () =>
            {
                await _userModel.UpdateProfile(new UpdateUserDto { UserId = 99999, Email = "wrong@cinema.hu", FullName = "Wrong User" });
            });
            Assert.NotNull(ex);
            Assert.IsType<KeyNotFoundException>(ex);
        }

        // ChangePassword
        [Fact]
        public async Task ChangePass()
        {
            var newpass = _context.users.First(x => x.UserId == 1);
            await _userModel.ChangePassword(newpass.UserId, "admin123", "newPass");
            Assert.NotNull(newpass);
            Assert.Equal(HashPass("newPass"), _context.users.First(x => x.UserId == 1).Password);
        }
        [Fact]
        public async Task ChangePass_WrongUser()
        {
            var ex = await Record.ExceptionAsync(async () =>
            {
                await _userModel.ChangePassword(99999, "anyPass", "newpass");
            });
            Assert.NotNull(ex);
            Assert.IsType<KeyNotFoundException>(ex);
        }
        [Fact]
        public async Task ChangePass_WrongOld()
        {
            var user = _context.users.First(x => x.Email == "user@cinema.hu");
            var ex = await Record.ExceptionAsync(async () =>
            {
                await _userModel.ChangePassword(user.UserId, "wrongOldPass", "newpass");
            });
            Assert.NotNull(ex);
            Assert.IsType<InvalidDataException>(ex);
        }

    }
}