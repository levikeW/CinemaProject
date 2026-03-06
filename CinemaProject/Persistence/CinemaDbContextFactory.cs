using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CinemaProject.Persistence
{
    public class CinemaDbContextFactory : IDesignTimeDbContextFactory<CinemaDbContext>
    {
        public CinemaDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<CinemaDbContext>();

            optionsBuilder.UseNpgsql("Host=localhost;Database=CinemaDb;UserId=postgres;Password=root;");

            return new CinemaDbContext(optionsBuilder.Options);
        }
    }
}
