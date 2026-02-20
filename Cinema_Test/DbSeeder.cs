using CinemaProject.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Cinema_Test
{
    public class DbSeeder
    {
        public static void Seed(CinemaDbContext db)
        {
            if (db.movies.Any()) return;

            var images = new List<Image>
        {
            new Image { ImageContent = new byte[] { 0x01 } },
            new Image { ImageContent = new byte[] { 0x02 } },
            new Image { ImageContent = new byte[] { 0x03 } }
        };

            db.images.AddRange(images);
            db.SaveChanges();

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

            var rooms = new List<Room>
        {
            new Room { RoomName = "Room 1" },
            new Room { RoomName = "Room 2" }
        };

            db.rooms.AddRange(rooms);
            db.SaveChanges();

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

            var screenings = new List<FilmScreening>
        {
            new FilmScreening {
                MovieId = movies[0].MovieId,
                RoomId = rooms[0].RoomId,
                Date = DateTime.Now.AddDays(1)
            },
            new FilmScreening {
                MovieId = movies[1].MovieId,
                RoomId = rooms[1].RoomId,
                Date = DateTime.Now.AddDays(2)
            },
            new FilmScreening {
                MovieId = movies[2].MovieId,
                RoomId = rooms[0].RoomId,
                Date = DateTime.Now.AddDays(3)
            }
        };

            db.filmScreenings.AddRange(screenings);
            db.SaveChanges();

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

            var cart = new Cart
            {
                UserId = users[1].UserId,
                FilmScreeningId = screenings[0].FilmScreeningId,
                TicketId = tickets[0].TicketId,
                Amount = 2,
                TotalPrice = 2 * tickets[0].TicketPrice
            };

            db.carts.Add(cart);
            db.SaveChanges();

            var selectedSeats = db.seats
                .Where(s => s.RoomId == rooms[0].RoomId)
                .Take(2)
                .ToList();

            foreach (var seat in selectedSeats)
            {
                cart.Seats.Add(seat);
                seat.IsReserved = true;
            }

            db.SaveChanges();

            var payment = new PaymentReservation
            {
                CartId = cart.CartId,
                Date = DateTime.Now,
                FilmScreeningId = screenings[0].FilmScreeningId,
                Amount = cart.Amount,
                UserId = users[1].UserId,
                IsPaid = true
            };

            db.paymentReservations.Add(payment);
            db.SaveChanges();

            var receipt = new Receipt
            {
                PaymentReservationId = payment.PaymentReservationId,
                MovieTitle = movies[0].MovieTitle,
                ScreeningDate = screenings[0].Date,
                RoomName = rooms[0].RoomName,
                TicketId = tickets[0].TicketId,
                Amount = cart.Amount,
                TotalPrice = cart.TotalPrice,
                PaymentDate = DateTime.Now,
                UserEmail = users[1].Email,
                Seats = selectedSeats
            };

            db.receipts.Add(receipt);
            db.SaveChanges();

            var confirmation = new ReservationConfirmation
            {
                PaymentReservationId = payment.PaymentReservationId,
                MovieTitle = movies[0].MovieTitle,
                ScreeningDate = screenings[0].Date,
                RoomName = rooms[0].RoomName,
                TicketId = tickets[0].TicketId,
                Amount = cart.Amount,
                TotalPrice = cart.TotalPrice,
                UserEmail = users[1].Email,
                Seats = selectedSeats
            };

            db.reservationConfirmations.Add(confirmation);
            db.SaveChanges();
        }

        private static string HashPass(string password)
        {
            using var Sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = Sha.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

    }
}
