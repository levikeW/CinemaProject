using CinemaProject.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Cinema_Test
{
    internal class DbContextFactory
    {
        public static CinemaDbContext Create()
        {
            // 1️⃣ SQLite in-memory kapcsolat
            var connection = new SqliteConnection("Data Source=:memory:");
            connection.Open(); // FONTOS: nyitva kell maradnia

            // DbContextOptions, ugyan az mint postgres adatbázisnál
            var options = new DbContextOptionsBuilder<CinemaDbContext>()
                .UseSqlite(connection)
                .EnableSensitiveDataLogging()
                .Options;

            // DbContext létrehozása
            var context = new CinemaDbContext(options);

            // Sémák létrehozása, hogy biztosan létezzen az adatbázis
            context.Database.EnsureCreated();

            // Seed adatok
            DbSeeder.Seed(context);

            return context;
        }

        public static CinemaDbContext CreateEmpty()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            connection.Open();

            var options = new DbContextOptionsBuilder<CinemaDbContext>()
                .UseSqlite(connection)
                .Options;

            var context = new CinemaDbContext(options);
            context.Database.EnsureCreated();

            // direkt NEM seedelünk, hogy ne legyen adat --> allroom tesztelése miatt
            return context;
        }
    }
}
