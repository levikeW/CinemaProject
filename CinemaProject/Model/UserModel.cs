using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
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

        private const int MinPasswordLength = 6;

        private string HashPass(string password)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        private void ValidatePassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < MinPasswordLength)
                throw new InvalidOperationException($"Password must be at least {MinPasswordLength} characters long.");
        }

        public async Task Regist(RegistDto dto, string role = "User")
        {
            if (!IsValidEmail(dto.Email))
                throw new InvalidOperationException("Invalid email format");

            ValidatePassword(dto.Password);

            if (await _context.users.AnyAsync(x => x.Email == dto.Email))
                throw new InvalidOperationException("Already exists");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.users.Add(new User
            {
                Email = dto.Email,
                Password = HashPass(dto.Password),
                Role = role,
                FullName = dto.FullName,
                BillingAddress = dto.BillingAddress
            });

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task<User?> ValidateUser(LoginDto dto)
        {
            return await _context.users.FirstOrDefaultAsync(x => x.Email == dto.email && x.Password == HashPass(dto.password));
        }

        public async Task<UserDto?> ViewProfile(int userId)
        {
            return await _context.users.Where(x => x.UserId == userId)
                .Select(x => new UserDto
                {
                    UserId = x.UserId,
                    Email = x.Email,
                    FullName = x.FullName,
                    BillingAddress = x.BillingAddress
                }).FirstOrDefaultAsync();
        }

        public async Task DeleteProfile(int userId)
        {
            var user = await _context.users.FirstOrDefaultAsync(x => x.UserId == userId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            using var trx = await _context.Database.BeginTransactionAsync();

            _context.users.Remove(user);

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task UpdateProfile(UpdateUserDto dto)
        {
            var user = await _context.users.FirstOrDefaultAsync(x => x.UserId == dto.UserId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                if (!IsValidEmail(dto.Email))
                    throw new InvalidOperationException("Invalid email format");

                user.Email = dto.Email;
            }

            using var trx = await _context.Database.BeginTransactionAsync();

            if (!string.IsNullOrWhiteSpace(dto.Email))
                user.Email = dto.Email;

            if (!string.IsNullOrWhiteSpace(dto.FullName))
                user.FullName = dto.FullName;

            if (!string.IsNullOrWhiteSpace(dto.BillingAddress))
                user.BillingAddress = dto.BillingAddress;

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }

        public async Task ChangePassword(int userId, string oldPass, string newPass)
        {
            var user = await _context.users.FirstOrDefaultAsync(x => x.UserId == userId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            var oldHash = HashPass(oldPass);
            if (user.Password != oldHash)
                throw new InvalidOperationException("Old password is incorrect");

            ValidatePassword(newPass);

            var newHash = HashPass(newPass);

            using var trx = await _context.Database.BeginTransactionAsync();

            user.Password = newHash;

            await _context.SaveChangesAsync();
            await trx.CommitAsync();
        }
    }
}