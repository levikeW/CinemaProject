using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Model;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

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

        // CHANGE ROLE
        [Fact]
        public async Task ChangeRole()
        {
            var user = _context.users.FirstOrDefault(x => x.UserId == 2);
            await _adminModel.ChangeRole(user.UserId, "Admin", actAdminId: 1);
            var updated = _context.users.First(u => u.UserId == user.UserId);
            Assert.Equal("Admin", updated.Role);
        }

        [Fact]
        public async Task ChangeRoleAsync_Fail()
        {
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _adminModel.ChangeRole(1, "User", actAdminId: 1);
            });
            Assert.Equal("You cannot change your own role.", ex.Message);
        }

        [Fact]
        public async Task ChangeRole_Wrong()
        {
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _adminModel.ChangeRole(99999, "Admin", actAdminId: 1);
            });
            Assert.Equal("User not found", ex.Message);
        }

        [Fact]
        public async Task ChangeRoleAsync_Fail2()
        {
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _adminModel.ChangeRole(3, "User", actAdminId: 1);
            });
            Assert.Equal("You cannot demote another Admin.", ex.Message);
        }

        // USER AND RESERVATION
        [Fact]
        public async Task GetAllUsers()
        {
            var users = await _adminModel.GetAllUsers();
            Assert.NotEmpty(users);
        }

        [Fact]
        public async Task SearchUser()
        {
            var results = await _adminModel.SearchUser("user");
            Assert.NotEmpty(results);
        }

        [Fact]
        public async Task DeleteUser()
        {
            var userId = 2;
            await _adminModel.DeleteUser(userId);
            Assert.False(_context.users.Any(u => u.UserId == userId));
        }

        [Fact]
        public async Task DeleteUserThrows()
        {
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () => await _adminModel.DeleteUser(99999));
            Assert.Equal("User not found", ex.Message);
        }

        [Fact]
        public async Task GetAllReservations()
        {
            var reservations = await _adminModel.GetAllReservations();
            Assert.NotEmpty(reservations);
        }

        [Fact]
        public async Task ModifyReservation()
        {
            var reservation = _context.paymentReservations.Include(x => x.Cart).First();
            var dto = new ModifyReservationDto
            {
                PaymentReservationId = reservation.PaymentReservationId,
                CartId = reservation.CartId,
                Date = reservation.Date.AddDays(1),
                IsPaid = !reservation.IsPaid,
                Amount = reservation.Cart.Amount,
                Price = reservation.Cart.TotalPrice / reservation.Cart.Amount,
                Seats = reservation.Cart.Seats.Select(s => new SeatDto
                {
                    SeatId = s.SeatId,
                    RoomId = s.RoomId,
                    RowNumber = s.RowNumber,
                    SeatNumber = s.SeatNumber
                }).ToList(),
                FilmScreeningId = reservation.Cart.FilmScreeningId,
                UserId = reservation.Cart.UserId
            };

            await _adminModel.ModifyReservation(dto);
            var updated = _context.paymentReservations.Include(x => x.Cart)
                .First(x => x.PaymentReservationId == reservation.PaymentReservationId);

            Assert.Equal(dto.Date, updated.Date);
            Assert.Equal(dto.IsPaid, updated.IsPaid);
        }

        [Fact]
        public async Task DeleteReservation()
        {
            var reservation = _context.paymentReservations.First();
            await _adminModel.DeleteReservation(reservation.PaymentReservationId);
            Assert.False(_context.paymentReservations.Any(r => r.PaymentReservationId == reservation.PaymentReservationId));
        }

        // MOVIE
        [Fact]
        public async Task AddNewMovie()
        {
            var dto = new NewMovieDto
            {
                MovieTitle = "Test Movie",
                Duration = 120,
                Genre = "Action",
                Director = "Director X",
                Description = "Desc",
                ImageId = 1
            };

            await _adminModel.NewMovie(dto);
            var movie = _context.movies.FirstOrDefault(m => m.MovieTitle == "Test Movie");
            Assert.NotNull(movie);
        }

        [Fact]
        public async Task MovieDuplicate()
        {
            _context.movies.Add(new Movie
            {
                MovieTitle = "Test Movie",
                Duration = 120,
                Genre = "Action",
                Director = "Director X",
                Description = "Desc",
                ImageId = 1
            });
            await _context.SaveChangesAsync();

            var dto = new NewMovieDto
            {
                MovieTitle = "Test Movie",
                Duration = 120,
                Genre = "Action",
                Director = "Director X",
                Description = "Desc",
                ImageId = 1
            };

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () => await _adminModel.NewMovie(dto));
            Assert.Equal("Already exists", ex.Message);
        }

        [Fact]
        public async Task ModifyMovie()
        {
            var movie = _context.movies.First();
            var dto = new ModifyMovieDto
            {
                MovieId = movie.MovieId,
                MovieTitle = movie.MovieTitle + " Updated",
                Duration = movie.Duration + 10,
                Genre = movie.Genre,
                Director = movie.Director,
                Description = movie.Description,
                ImageId = movie.ImageId
            };

            await _adminModel.ModifyMovie(dto);
            var updated = _context.movies.First(m => m.MovieId == dto.MovieId);
            Assert.Equal(dto.MovieTitle, updated.MovieTitle);
        }

        [Fact]
        public async Task DeleteMovie()
        {
            var movie = _context.movies.First();
            await _adminModel.DeleteMovie(movie.MovieId);
            Assert.False(_context.movies.Any(m => m.MovieId == movie.MovieId));
        }

        // SCREENING
        [Fact]
        public async Task AddNewScreening()
        {
            var movie = _context.movies.First();
            var dto = new NewScreeningDto
            {
              
                MovieTitle = movie.MovieTitle,
                RoomName = "Room 1",
                RoomId = 1,
                Date = System.DateTime.Now.AddDays(1)
            };

            await _adminModel.NewScreening(dto);
            var screening = _context.filmScreenings.FirstOrDefault(s => s.MovieId == movie.MovieId && s.RoomId == 1);
            Assert.NotNull(screening);
        }

        [Fact]
        public async Task ModifyScreening()
        {
            var screening = _context.filmScreenings.First();
            var otherRoom = _context.rooms.First(r => r.RoomId != screening.RoomId);

            var dto = new ModifyFilmScreeningDto
            {
                FilmScreeningId = screening.FilmScreeningId,
                MovieTitle = "Inception",
                RoomName = otherRoom.RoomName,
                RoomId = otherRoom.RoomId,
                Date = screening.Date.AddDays(1)
            };

            await _adminModel.ModifyFilmScreening(dto);

            var updated = _context.filmScreenings
                .AsNoTracking()
                .First(s => s.FilmScreeningId == screening.FilmScreeningId);

            Assert.Equal(otherRoom.RoomId, updated.RoomId);
            Assert.Equal(otherRoom.RoomName, updated.RoomName);
        }

            [Fact]
        public async Task DeleteScreening()
        {
            var screening = _context.filmScreenings.First();
            await _adminModel.DeleteScreening(screening.FilmScreeningId);
            Assert.False(_context.filmScreenings.Any(s => s.FilmScreeningId == screening.FilmScreeningId));
        }
       

        // IMAGE
        [Fact]
        public async Task AddImage()
        {
            var dto = new ImageDto { ImageContent = new byte[] { 0x1, 0x2 } };
            await _adminModel.UploadImage(dto);
            Assert.True(_context.images.Any(img => img.ImageContent.SequenceEqual(dto.ImageContent)));
        }

        [Fact]
        public async Task DeleteImage()
        {
            var image = _context.images.FirstOrDefault(i => !_context.movies.Any(m => m.ImageId == i.ImageId));
            if (image == null)
            {
                image = new Image { ImageContent = [] };
                _context.images.Add(image);
                await _context.SaveChangesAsync();
            }

            await _adminModel.DeleteImage(image.ImageId);
            Assert.False(_context.images.Any(i => i.ImageId == image.ImageId));
        }

        [Fact]
        public async Task DeleteImageThrows()
        {
            var movie = _context.movies.First();
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () => await _adminModel.DeleteImage(movie.ImageId));
            Assert.Equal("Image is already exist", ex.Message);
        }
    }
}