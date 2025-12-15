using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace CinemaProject.Persistence
{
    public class CinemaDbContext : DbContext
    {
        public DbSet<PaymentReservation> paymentReservations { get; set; }
        public DbSet<Cart> carts { get; set; }
        public DbSet<User> users { get; set; }
        public DbSet<Ticket> tickets { get; set; }
        public DbSet<FilmScreening> filmScreenings { get; set; }
        public DbSet<Movie> movies { get; set; }
        public DbSet<Room> rooms { get; set; }
        public DbSet<Image> images { get; set; }
        public DbSet<Seat> seats { get; set; }

        public CinemaDbContext(DbContextOptions<CinemaDbContext> options) : base(options) { }
    }

    public class PaymentReservation
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PaymentReservationId { get; set; }
        public int CartId { get; set; }
        public DateTime Date { get; set; }
        public int FilmScreeningId { get; set; }
        public int Amount { get; set; }
        public int UserId { get; set; }
        public bool IsPaid { get; set; }
        public Cart Cart { get; set; }
        public FilmScreening FilmScreening { get; set; }
        public User User { get; set; }
    }

    public class Cart
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CartId { get; set; }
        public int UserId { get; set; }
        public int FilmScreeningId { get; set; }
        public int TicketId { get; set; }
        public int Amount { get; set; }
        public int TotalPrice { get; set; }
        public ICollection<Seat> Seats { get; set; } = new List<Seat>();
        public User User { get; set; }
        public FilmScreening FilmScreening { get; set; }
        public Ticket Ticket { get; set; }
    }

    [Index(nameof(Email), IsUnique = true)]
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int UserId { get; set; }
        [Required]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        [Required]
        public string FullName { get; set; }
        public string BillingAddress { get; set; }
        public string Role { get; set; } = "User";
    }
    public class Ticket
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TicketId { get; set; }
        [Required]
        public string TicketType { get; set; }
        [Required]
        public int TicketPrice { get; set; }
        public int FilmScreeningId { get; set; }
        public FilmScreening FilmScreening { get; set; }
    }

    public class FilmScreening
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int FilmScreeningId { get; set; }
        public int MovieId { get; set; }
        public int RoomId { get; set; }
        public DateTime Date { get; set; }
        public Movie Movie { get; set; }
        public Room Room { get; set; }
    }

    public enum MovieStatus
    {
        Inactive,
        NowRunning
    }

    public class Movie
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MovieId { get; set; }
        [Required]
        public string MovieTitle { get; set; }
        [Required]
        public int Duration { get; set; }
        [Required]
        public string Genre { get; set; }
        [Required]
        public string Director { get; set; }
        [Required]
        public string Description { get; set; }
        public int ImageId { get; set; }
        public MovieStatus Status { get; set; } = MovieStatus.Inactive;

        public ICollection<FilmScreening> FilmScreenings { get; set; } = new List<FilmScreening>();

        public Image Image { get; set; }
    }

    public class Room
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RoomId { get; set; }
        [Required]
        public string RoomName { get; set; }
        public ICollection<Seat> Seats { get; set; } = new List<Seat>();
    }
    public class Image
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ImageId { get; set; }
        public byte[] ImageContent { get; set; }
    }

    public class Seat
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SeatId { get; set; }
        public int RowNumber { get; set; }
        public int SeatNumber { get; set; }
        public int RoomId { get; set; }
        public bool IsReserved { get; set; } = false;
        public Room Room { get; set; }
    }
    public class Receipt
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ReceiptId { get; set; }
        public int PaymentReservationId { get; set; }
        public string MovieTitle { get; set; }
        public DateTime ScreeningDate { get; set; }
        public string RoomName { get; set; }
        public int TicketId { get; set; }
        public int Amount { get; set; }
        public int TotalPrice { get; set; }
        public DateTime PaymentDate { get; set; }
        public string UserEmail { get; set; }
        public ICollection<Seat> Seats { get; set; } = new List<Seat>();
        public PaymentReservation PaymentReservation { get; set; }
    }

    public class ReservationConfirmation
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ConfirmationId { get; set; }
        public int PaymentReservationId { get; set; }
        public string MovieTitle { get; set; }
        public DateTime ScreeningDate { get; set; }
        public string RoomName { get; set; }
        public ICollection<Seat> Seats { get; set; } = new List<Seat>();
        public int TicketId { get; set; }
        public int Amount { get; set; }
        public int TotalPrice { get; set; }
        public string UserEmail { get; set; }
        public PaymentReservation PaymentReservation { get; set; }
    }
}
