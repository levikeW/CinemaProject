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
    public class AdminModelTest
    {
        private readonly AdminModel _adminModel;
        private readonly CinemaDbContext _context;

        public AdminModelTest()
        {
            _context = DbContextFactory.Create();
            DbSeeder.Seed(_context);
            _adminModel = new AdminModel(_context);
        }
        private string HashPass(string password)
        {
            using var Sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = Sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        [Fact]
        public async Task ChangeRole()
        {
            var changerole = _context.users.FirstOrDefault(x => x.UserId == 1);

            Assert.NotNull(changerole);
            Assert.Equal("Admin", changerole.Role);
        }
        [Fact]
        public async Task ChangeRole_Wrong()
        {
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _adminModel.ChangeRole(99999);
            });
            Assert.Equal("User not found", ex.Message);
        }
    }
}