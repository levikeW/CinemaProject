using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Text.Json;
using Xunit;

namespace Cinema_IntegrationTest;
public class CinemaControllerTest : IClassFixture<CustomApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomApplicationFactory _factory;

    public CinemaControllerTest(CustomApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });
    }

    [Fact]
    public async Task GetAllMovies()
    {
        var response = await _client.GetAsync("api/cinema/getallmovies");
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(body));
    }

    [Fact]
    public async Task GetAllScreenings()
    {
        var response = await _client.GetAsync("/api/cinema/getallscreenings");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var screenings = JsonSerializer.Deserialize<List<FilmScreeningDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(screenings);
        Assert.NotEmpty(screenings);
    }

    [Fact]
    public async Task GetAllTickets()
    {
        var response = await _client.GetAsync("/api/cinema/getalltickettype");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var tickets = JsonSerializer.Deserialize<List<TicketTypeDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(tickets);
        Assert.NotEmpty(tickets);
    }

    [Fact]
    public async Task GetAllRooms()
    {
        var response = await _client.GetAsync("/api/cinema/getallrooms");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rooms = JsonSerializer.Deserialize<List<RoomDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(rooms);
        Assert.NotEmpty(rooms);
    }

    [Fact]
    public async Task SearchMovieByTitle()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var movie = db.movies.First();
        var item = movie.MovieTitle.Substring(0, Math.Min(3, movie.MovieTitle.Length));

        var response = await _client.GetAsync($"/api/cinema/searchmoviebytitle?item={"Interstellar"}");
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(body));
    }

    [Fact]
    public async Task SearchMovieByGenre()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var movie = db.movies.First();

        var response = await _client.GetAsync($"/api/cinema/searchmoviebygenre?item={"Historical"}");
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(body));
    }

    [Fact]
    public async Task SearchMovieByDirector()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var movie = db.movies.First();

        var response = await _client.GetAsync($"/api/cinema/searchmoviebydirector?item={"Christopher Nolan"}");
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(body));
    }

    [Fact]
    public async Task GetScreeningDetails()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var screening = db.filmScreenings.First();
        var queryTime = Uri.EscapeDataString(screening.Date.ToString("o"));
        var response = await _client.GetAsync($"/api/cinema/getscreeningdetails?time={queryTime}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var screenings = JsonSerializer.Deserialize<List<FilmScreeningDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotNull(screenings);
        Assert.NotEmpty(screenings);
        Assert.Contains(screenings, s => s.FilmScreeningId == screening.FilmScreeningId);
    }

    [Fact]
    public async Task GetUpcomingScreenings()
    {
        var response = await _client.GetAsync("/api/cinema/getupcomingscreenings");
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(body));
    }

    [Fact]
    public async Task IsMovieNowRunning()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var movie = db.movies.First(x => x.Status == MovieStatus.NowRunning);

        var response = await _client.GetAsync($"/api/cinema/ismovienowrunning?movieTitle={Uri.EscapeDataString(movie.MovieTitle)}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var isRunning = JsonSerializer.Deserialize<bool>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.True(isRunning);
    }

    [Fact]
    public async Task GetRoomCapacity()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var room = db.rooms.First();

        var response = await _client.GetAsync($"/api/cinema/getroomcapacity?roomId={room.RoomId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var capacity = JsonSerializer.Deserialize<int>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.True(capacity > 0);
    }

    [Fact]
    public async Task GetSeats()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var screening = db.filmScreenings.First();
        var room = db.rooms.First(x => x.RoomId == screening.RoomId);

        var response = await _client.GetAsync($"/api/cinema/getseats?roomId={room.RoomId}&screeningId={screening.FilmScreeningId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var seats = JsonSerializer.Deserialize<List<SeatDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(seats);
        Assert.NotEmpty(seats);
    }

    [Fact]
    public async Task IsSeatAvailable()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var screening = db.filmScreenings.First();
        var seat = db.seats.First(x => x.RoomId == screening.RoomId && !x.IsReserved);

        var response = await _client.GetAsync($"/api/cinema/isseatavailable?seatId={seat.SeatId}&screeningId={screening.FilmScreeningId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var isAvailable = JsonSerializer.Deserialize<bool>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.True(isAvailable);
    }

    [Fact]
    public async Task HasFreeSeat()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var screening = db.filmScreenings.First();

        var response = await _client.GetAsync($"/api/cinema/hasfreeseat?screeningId={screening.FilmScreeningId}&requiredSeats=1");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(body));
    }

    [Fact]
    public async Task GetTicketsByScreening()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var screening = db.filmScreenings.First();

        var response = await _client.GetAsync($"/api/cinema/getticketsbyscreening?screeningId={screening.FilmScreeningId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tickets = JsonSerializer.Deserialize<List<TicketDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(tickets);
        Assert.NotEmpty(tickets);
    }

    [Fact]
    public async Task SetQuantity()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var ticket = db.tickets.Include(x => x.TicketType).First(x => x.FilmScreeningId != null);

        var cart = new Cart
        {
            UserId = db.users.First().UserId,
            FilmScreeningId = ticket.FilmScreeningId!.Value,
            TicketId = ticket.TicketId,
            Amount = 1,
            TotalPrice = ticket.TicketType.TicketPrice
        };
        db.carts.Add(cart);
        db.SaveChanges();

        var newAmount = 3;
        var response = await _client.PutAsync($"/api/cinema/setquantity?cartId={cart.CartId}&amount={newAmount}", null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(body));
    }

    [Fact]
    public async Task GetImage()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var movie = db.movies.First();

        var response = await _client.GetAsync($"/api/cinema/getimage?movieId={movie.MovieId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var image = JsonSerializer.Deserialize<ImageDto>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(image);
        Assert.NotEmpty(image.ImageContent);
    }
}