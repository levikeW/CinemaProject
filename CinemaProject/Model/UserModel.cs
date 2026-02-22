using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace CinemaProject.Model
{
    public class UserModel
    {
        private readonly CinemaDbContext _context;
        public UserModel(CinemaDbContext context)
        {
            _context = context;
        }
        private async Task<string> HashPass(string password)
        {
            using var Sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = Sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
        public async Task Regist(RegistDto dto, string role = "User")
        {
            if (_context.users.Any(x => x.Email == dto.Email))
            {
                throw new InvalidOperationException("Already exixts");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                _context.users.Add(new User { Email = dto.Email, Password = await HashPass(dto.Password), Role = role, FullName = dto.FullName});
                await _context.SaveChangesAsync();
                await trx.CommitAsync();
            }
            await Task.CompletedTask;
        }

        public async Task<User?> ValidateUser(LoginDto dto)
        {
            var hash = await HashPass(dto.password);
            var user = _context.users.Where(x => x.Email == dto.email);
            return user.Where(x => x.Password == hash).FirstOrDefault();
        }

        public async Task<UserDto?> ViewProfile(int userId)
        {
            return _context.users.Where(x => x.UserId == userId).Select(x => new UserDto
            {
                UserId = x.UserId,
                Email = x.Email,
                FullName = x.FullName,
                BillingAddress = x.BillingAddress
            }).FirstOrDefault();
        }

        public async Task DeleteProfile(int userId)
        {
            var user = _context.users.FirstOrDefault(x => x.UserId == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                _context.users.Remove(user);
                await _context.SaveChangesAsync();
                await trx.CommitAsync();
            }
        }

        public async Task UpdateProfile(UpdateUserDto dto)
        {
            var user = _context.users.FirstOrDefault(x => x.UserId == dto.UserId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                if (!string.IsNullOrEmpty(dto.Email))
                {
                    user.Email = dto.Email;
                }
                if (!string.IsNullOrEmpty(dto.FullName))
                {
                    user.FullName = dto.FullName;
                }
                if (!string.IsNullOrEmpty(dto.BillingAddress))
                {
                    user.BillingAddress = dto.BillingAddress;
                }
                await _context.SaveChangesAsync();
                await trx.CommitAsync();
            }
        }

        public async Task ChangePassword(int userId, string oldPass, string newPass)
        {
            var user = _context.users.FirstOrDefault(x => x.UserId == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }
            var oldHash = await HashPass(oldPass);
            if (user.Password != oldHash)
            {
                throw new InvalidOperationException("Old password is incorrect");
            }
            var newHash = await HashPass(newPass);
            using var trx = _context.Database.BeginTransaction();
            {
                user.Password = newHash;
                await _context.SaveChangesAsync();
                await trx.CommitAsync();
            }
        }
    }
}
