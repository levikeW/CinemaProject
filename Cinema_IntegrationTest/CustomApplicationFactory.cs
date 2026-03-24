using CinemaProject.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.VisualStudio.TestPlatform.TestHost;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

/*namespace Cinema_IntegrationTest
{
    public class CustomApplicationFactory : WebApplicationFactory<Program>
    {
        private SqliteConnection _connection = null;

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll(typeof(DbContextOptions<CinemaDbContext>));
                services.RemoveAll(typeof(IDbContextPool<CinemaDbContext>));
                services.RemoveAll(typeof(IScopedDbContextLease<CinemaDbContext>));
                services.RemoveAll<Microsoft.EntityFrameworkCore.Infrastructure.IDbContextOptionsConfiguration<CinemaDbContext>>();

                _connection = new SqliteConnection("Data Source=:memory:");
                _connection.Open();

                services.AddDbContextPool<CinemaDbContext>(options =>
                {
                    options.UseSqlite(_connection);
                    options.EnableSensitiveDataLogging();
                });

                var sp = services.BuildServiceProvider();

                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetService<CinemaDbContext>();
               // db.Database.EnsureDeleted();
                db.Database.EnsureCreated();

                if (!db.movies.Any())
                {
                    DbSeeder.Seed(db);
                }
            });
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);

            if (disposing)
            {
                _connection.Dispose();
            }
        }
    }
}*/