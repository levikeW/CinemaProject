using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CinemaProject.Model
{
    public class UserModel
    {
        private readonly CinemaDbContext _context;
        public UserModel(CinemaDbContext context)
        {
            _context = context;
        }
        private string HashPass(string password)
        {
            using var Sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = Sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
        public void Regist(string email, string pass, string role = "User")
        {
            if (_context.users.Any(x => x.Email == email))
            {
                throw new InvalidOperationException("Already exixts");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                _context.users.Add(new User { Email = email, Password = HashPass(pass), Role = role });
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public User? ValidateUser(string email, string pass)
        {
            var hash = HashPass(pass);
            var user = _context.users.Where(x => x.Email == email);
            return user.Where(x => x.Password == hash).FirstOrDefault();
        }

        public UserDto? ViewProfile(int userId)
        {
            return _context.users.Where(x => x.UserId == userId).Select(x => new UserDto
            {
                UserId = x.UserId,
                Email = x.Email,
                FullName = x.FullName,
                BillingAddress = x.BillingAddress
            }).FirstOrDefault();
        }

        public void DeleteProfile(int userId)
        {
            var user = _context.users.FirstOrDefault(x => x.UserId == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                _context.users.Remove(user);
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void UpdateProfile(int userId, UpdateUserDto dto)
        {
            var user = _context.users.FirstOrDefault(x => x.UserId == userId);
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
                _context.SaveChanges();
                trx.Commit();
            }
        }

        public void ChangePassword(int userId, string oldPass, string newPass)
        {
            var user = _context.users.FirstOrDefault(x => x.UserId == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }
            var oldHash = HashPass(oldPass);
            if (user.Password != oldHash)
            {
                throw new InvalidOperationException("Old password is incorrect");
            }
            var newHash = HashPass(newPass);
            using var trx = _context.Database.BeginTransaction();
            {
                user.Password = newHash;
                _context.SaveChanges();
                trx.Commit();
            }
        }
        public void ChangeRole(int userId)
        {
            var user = _context.users.FirstOrDefault(x => x.UserId == userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }
            using var trx = _context.Database.BeginTransaction();
            {
                user.Role = "Admin";
                _context.SaveChanges();
                trx.Commit();
            }
        }
    }
}
