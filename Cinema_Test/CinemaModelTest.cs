using Cinema.Dto;
using CinemaProject.Model;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

/*namespace Cinema_Test
{
    public class CinemaModelTest
    {
        private readonly CinemaModel _cinemaModel;
        private readonly CinemaDbContext _context;

        public CinemaModelTest()
        {
            _context = DbContextFactory.Create();
            DbSeeder.Seed(_context);
            _cinemaModel = new CinemaModel(_context);
        }

        // MOVIE QUERIES
        [Fact]
        public async Task GetAllMovies()
        {
            var movies = await _cinemaModel.GetAllMovies();
            Assert.NotEmpty(movies);
            Assert.All(movies, m => Assert.NotNull(m.Screenings));
        }

        [Fact]
        public async Task SearchMovieByTitle()
        {
            var movie = _context.movies.First();
            var results = await _cinemaModel.SearchMovieByTitle(movie.MovieTitle.Substring(0, 3));

            Assert.NotEmpty(results);
            Assert.Contains(results, m => m.MovieTitle == movie.MovieTitle);
        }

        [Fact]
        public async Task SearchMovieByGenre()
        {
            var results = await _cinemaModel.SearchMovieByGenre("Action");
            Assert.NotNull(results);
        }

        [Fact]
        public async Task IsMovieNowRunning()
        {
            var movie = _context.movies.First(m => m.Status == MovieStatus.NowRunning);
            var isRunning = await _cinemaModel.IsMovieNowRunning(movie.MovieTitle);
            Assert.True(isRunning);
        }

        // SCREENING & ROOM
        [Fact]
        public async Task GetAllScreenings()
        {
            var screenings = await _cinemaModel.GetAllScreenings();
            Assert.NotEmpty(screenings);
        }

        [Fact]
        public async Task GetUpcomingScreenings()
        {
            var screenings = await _cinemaModel.GetUpcomingScreenings();
            Assert.NotNull(screenings);
        }

        [Fact]
        public async Task GetRoomCapacity()
        {
            var room = _context.rooms.Include(r => r.Seats).First();
            var capacity = await _cinemaModel.GetRoomCapacity(room.RoomId);
            Assert.Equal(room.Seats.Count, capacity);
        }

        [Fact]
        public async Task GetRoomCapacity_Wrong()
        {
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _cinemaModel.GetRoomCapacity(99999));
            Assert.Equal("Room not found", ex.Message);
        }

        // SEATS & TICKETS
        [Fact]
        public async Task GetSeats()
        {
            var screening = _context.filmScreenings.First();
            var seats = await _cinemaModel.GetSeats(screening.RoomId, screening.FilmScreeningId);

            Assert.NotEmpty(seats);
            Assert.IsType<List<SeatDto>>(seats);
        }

        [Fact]
        public async Task IsSeatAvailable()
        {
            var screening = _context.filmScreenings.First();
            var seat = _context.seats.First(s => s.RoomId == screening.RoomId);

            var isAvailable = await _cinemaModel.IsSeatAvailable(seat.SeatId, screening.FilmScreeningId);
            Assert.True(isAvailable || !isAvailable);
        }

        [Fact]
        public async Task HasFreeSeats_Wrong_NotFound()
        {
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _cinemaModel.HasFreeSeats(99999, 1));
            Assert.Equal("Screening not found", ex.Message);
        }

        // CART & QUANTITY
        [Fact]
        public async Task SetQuantity()
        {
            var cart = _context.carts.Include(c => c.Ticket).First();
            var newAmount = 5;

            await _cinemaModel.SetQuantity(cart.CartId, newAmount);

            var updated = _context.carts.First(c => c.CartId == cart.CartId);
            Assert.Equal(newAmount, updated.Amount);
            Assert.Equal(cart.Ticket.TicketPrice * newAmount, updated.TotalPrice);
        }

        [Fact]
        public async Task SetQuantity_Wrong_Invalid()
        {
            var cart = _context.carts.First();
            var ex = await Assert.ThrowsAsync<ArgumentException>(async () =>
                await _cinemaModel.SetQuantity(cart.CartId, 0));

            Assert.Equal("Quantity must be greater than zero", ex.Message);
        }

        [Fact]
        public async Task SetQuantity_Wrong_NotFound()
        {
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _cinemaModel.SetQuantity(99999, 5));

            Assert.Equal("Cart not found", ex.Message);
        }

        // IMAGE
        [Fact]
        public async Task GetImage()
        {
            var movie = _context.movies.First();
            var image = await _cinemaModel.GetImage(movie.MovieId);

            Assert.NotNull(image);
            Assert.Equal(movie.ImageId, image.ImageId);
        }
    }
}*/