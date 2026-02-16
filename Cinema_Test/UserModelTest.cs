using CinemaProject.Model;
using CinemaProject.Persistence;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;

namespace Cinema_Test
{
    public class UserModelTest
    {
        private readonly UserModel _userModel;
        private readonly CinemaDbContext _context;

        public UserModelTest()
        {
            _context = DbContextFactory.Create();
            _userModel = new UserModel(_context);
        }
        private string HashPass(string password)
        {
            using var Sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = Sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        [Fact]
        public void ValidatePass()
        {
            var user = _userModel.ValidateUser("admin@cinema.hu", HashPass("admin123"));

            Assert.NotNull(user);
            Assert.Equal("Admin User", user.FullName);
            Assert.Equal("Admin", user.Role);
        }

        [Fact]
        public void RegistValidate()
        {
            _userModel.Regist("ok@gmail.com", "ok123");

            var user = _context.users.FirstOrDefault(x => x.Email == "ok@gmail.com");

            Assert.NotNull(user);
            Assert.Equal("ok@gmai.com", user.Email);
            Assert.Equal("ok123", user.Password);
        }

        [Fact]
        public void ViewProfile()
        {
            var user = _context.users.First(x => x.Email == "admin@cinema.hu");

            var dto = _userModel.ViewProfile(user.UserId);

            Assert.NotNull(dto);
            Assert.Equal(user.UserId, dto.UserId);
            Assert.Equal("admin@cinema.hu", dto.Email);
            Assert.Equal("Admin User", dto.FullName);

        }

        [Fact]
        public void Delete()
        {
            _userModel.Regist("delete@cinema.hu", "1234");

            var user = _context.users.First(x => x.Email == "delete@cinema.hu");

            _userModel.DeleteProfile(user.UserId);

            Assert.False(_context.users.Any(x => x.Email == "delete@cinema.hu"));
        }

    }
}