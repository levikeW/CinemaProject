using System.Security.Cryptography;
using System.Text;
using CinemaProject.Persistence;

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
    }
}
