using CinemaProject.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;

namespace Cinema_IntegrationTest
{
    public class DbSeeder
    {
        public static void Seed(CinemaDbContext db)
        {
            if (db.movies.Any()) return;

            // IMAGES
            var images = new List<Image>
            {
                new Image { ImageContent = new byte[] { 0x01 } },
                new Image { ImageContent = new byte[] { 0x02 } },
                new Image { ImageContent = new byte[] { 0x03 } }
            };
            db.images.AddRange(images);
            db.SaveChanges();

            // MOVIES
            var movies = new List<Movie>
            {
                new Movie {
                    MovieTitle = "Inception",
                    Duration = 148,
                    Genre = "Sci-Fi",
                    Director = "Christopher Nolan",
                    Description = "Dream infiltration thriller.",
                    ImageId = images[0].ImageId,
                    Status = MovieStatus.NowRunning
                },
                new Movie {
                    MovieTitle = "Interstellar",
                    Duration = 169,
                    Genre = "Sci-Fi",
                    Director = "Christopher Nolan",
                    Description = "Space exploration mission.",
                    ImageId = images[1].ImageId,
                    Status = MovieStatus.NowRunning
                },
                new Movie {
                    MovieTitle = "Gladiator",
                    Duration = 155,
                    Genre = "Historical",
                    Director = "Ridley Scott",
                    Description = "Roman revenge epic.",
                    ImageId = images[2].ImageId,
                    Status = MovieStatus.NowRunning
                }
            };
            db.movies.AddRange(movies);
            db.SaveChanges();

            // ROOMS
            var rooms = new List<Room>
            {
                new Room { RoomName = "Room 1" },
                new Room { RoomName = "Room 2" }
            };
            db.rooms.AddRange(rooms);
            db.SaveChanges();

            // EATS
            var seats = new List<Seat>();
            foreach (var room in rooms)
            {
                for (int row = 1; row <= 5; row++)
                {
                    for (int seatNumber = 1; seatNumber <= 8; seatNumber++)
                    {
                        seats.Add(new Seat
                        {
                            RoomId = room.RoomId,
                            RowNumber = row,
                            SeatNumber = seatNumber,
                            IsReserved = false
                        });
                    }
                }
            }
            db.seats.AddRange(seats);
            db.SaveChanges();

            // SCREENINGS
            var screenings = new List<FilmScreening>
            {
                new FilmScreening {
                    MovieId = movies[0].MovieId,
                    MovieTitle = movies[0].MovieTitle,
                    RoomId = rooms[0].RoomId,
                    RoomName = rooms[0].RoomName,
                    Date = DateTime.UtcNow.AddDays(1)
                },
                new FilmScreening {
                    MovieId = movies[1].MovieId,
                    MovieTitle = movies[1].MovieTitle,
                    RoomId = rooms[1].RoomId,
                    RoomName = rooms[1].RoomName,
                    Date = DateTime.UtcNow.AddDays(2)
                },
                new FilmScreening {
                    MovieId = movies[2].MovieId,
                    MovieTitle = movies[2].MovieTitle,
                    RoomId = rooms[0].RoomId,
                    RoomName = rooms[0].RoomName,
                    Date = DateTime.UtcNow.AddDays(3)
                }
            };
            db.filmScreenings.AddRange(screenings);
            db.SaveChanges();

            // TICKETS
            var tickets = new List<Ticket>
            {
                new Ticket {
                    TicketType = "Adult",
                    TicketPrice = 3000,
                    FilmScreeningId = screenings[0].FilmScreeningId
                },
                new Ticket {
                    TicketType = "Student",
                    TicketPrice = 2500,
                    FilmScreeningId = screenings[0].FilmScreeningId
                },
                new Ticket {
                    TicketType = "Adult",
                    TicketPrice = 3200,
                    FilmScreeningId = screenings[1].FilmScreeningId
                }
            };
            db.tickets.AddRange(tickets);
            db.SaveChanges();

            // USERS
            var users = new List<User>
            {
                new User {
                    Email = "admin@cinema.hu",
                    Password = HashPass("admin123"),
                    FullName = "Admin User",
                    BillingAddress = "Budapest 1.",
                    Role = "Admin"
                },
                new User {
                    Email = "user@cinema.hu",
                    Password = HashPass("user123"),
                    FullName = "Test User",
                    BillingAddress = "Debrecen 5.",
                    Role = "User"
                }
            };
            db.users.AddRange(users);
            db.SaveChanges();

            // FUTURE CART & RESERVATION
            var futureCart = new Cart
            {
                UserId = users[1].UserId,
                FilmScreeningId = screenings[0].FilmScreeningId,
                TicketId = tickets[0].TicketId,
                Amount = 2,
                TotalPrice = 2 * tickets[0].TicketPrice
            };
            db.carts.Add(futureCart);
            db.SaveChanges();

            var selectedFutureSeats = db.seats
                .Where(s => s.RoomId == rooms[0].RoomId && !s.IsReserved)
                .OrderBy(s => s.SeatId)
                .Take(2)
                .ToList();

            foreach (var seat in selectedFutureSeats)
            {
                futureCart.Seats.Add(seat);
                seat.IsReserved = true;
            }
            db.SaveChanges();

            var futureReservation = new PaymentReservation
            {
                CartId = futureCart.CartId,
                FilmScreeningId = screenings[0].FilmScreeningId,
                UserId = users[1].UserId,
                Amount = futureCart.Amount,
                Date = DateTime.UtcNow.AddHours(1),
                IsPaid = false
            };
            db.paymentReservations.Add(futureReservation);
            db.SaveChanges();

            // PAST CART & RESERVATION
            var pastCart = new Cart
            {
                UserId = users[1].UserId,
                FilmScreeningId = screenings[1].FilmScreeningId,
                TicketId = tickets[2].TicketId,
                Amount = 1,
                TotalPrice = tickets[2].TicketPrice
            };
            db.carts.Add(pastCart);
            db.SaveChanges();

            var selectedPastSeats = db.seats
                .Where(s => s.RoomId == rooms[1].RoomId && !s.IsReserved)
                .OrderBy(s => s.SeatId)
                .Take(1)
                .ToList();

            foreach (var seat in selectedPastSeats)
            {
                pastCart.Seats.Add(seat);
                seat.IsReserved = true;
            }
            db.SaveChanges();

            var pastReservation = new PaymentReservation
            {
                CartId = pastCart.CartId,
                FilmScreeningId = screenings[1].FilmScreeningId,
                UserId = users[1].UserId,
                Amount = pastCart.Amount,
                Date = DateTime.UtcNow.AddDays(-1),
                IsPaid = true
            };
            db.paymentReservations.Add(pastReservation);
            db.SaveChanges();
        }



        private static string HashPass(string password)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}