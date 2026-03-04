using Cinema.Dto;
using Cinema_IntegrationTest;
using CinemaProject.Dto;
using CinemaProject.Model;
using CinemaProject.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
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
        var response = await _client.GetAsync("/api/cinema/getallmovies");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var movies = JsonSerializer.Deserialize<List<MovieDto>>(await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotEmpty(movies);
    }

    [Fact]
    public async Task GetAllScreenings()
    {
        var response = await _client.GetAsync("/api/cinema/getallscreenings");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var screenings = JsonSerializer.Deserialize<List<FilmScreeningDto>>(await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotEmpty(screenings);
    }

    [Fact]
    public async Task GetAllTickets()
    {
        var response = await _client.GetAsync("/api/cinema/getallticket");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var tickets = JsonSerializer.Deserialize<List<TicketDto>>(await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotEmpty(tickets);
    }

    [Fact]
    public async Task GetAllRooms()
    {
        var response = await _client.GetAsync("/api/cinema/getallrooms");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rooms = JsonSerializer.Deserialize<List<RoomDto>>(await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotEmpty(rooms);
    }

  

    [Fact]
    public async Task SearchMovieByTitle()
    {
        var response = await _client.GetAsync("/api/cinema/searchmoviebytitle?item=Inception");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var movies = JsonSerializer.Deserialize<List<MovieDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotEmpty(movies);
    }

    [Fact]
    public async Task SearchMovieByGenre()
    {
        var response = await _client.GetAsync("/api/cinema/searchmoviebygenre?item=Sci-Fi");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var movies = JsonSerializer.Deserialize<List<MovieDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotEmpty(movies);
    }

    [Fact]
    public async Task SearchMovieByDirector()
    {
        var response = await _client.GetAsync("/api/cinema/searchmoviebydirector?item=Christopher Nolan");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var movies = JsonSerializer.Deserialize<List<MovieDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotEmpty(movies);
    }
    
    /*
    [Fact]
    public async Task GetScreeningDetails()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var screening = db.filmScreenings.First();
        var queryTime = screening.Date.ToString("o");
        var response = await _client.GetAsync($"/api/cinema/getscreeningdetails?time={queryTime}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var screenings = JsonSerializer.Deserialize<List<FilmScreeningDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Assert.NotEmpty(screenings);
        Assert.Contains(screenings, s => s.FilmScreeningId == screening.FilmScreeningId);
    }
    */

    [Fact]
    public async Task GetUpcomingScreenings()
    {
        var response = await _client.GetAsync("/api/cinema/getupcomingscreenings");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var screenings = JsonSerializer.Deserialize<List<FilmScreeningDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotEmpty(screenings);
    }

    [Fact]
    public async Task IsMovieNowRunning()
    {
        var response = await _client.GetAsync("/api/cinema/ismovienowrunning?movieTitle=Inception");
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
        var room = db.rooms.First();

        var response = await _client.GetAsync($"/api/cinema/getseats?roomId={room.RoomId}&screeningId={screening.FilmScreeningId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var seats = JsonSerializer.Deserialize<List<SeatDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotEmpty(seats);
    }

    [Fact]
    public async Task IsSeatAvailable()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var screening = db.filmScreenings.First();
        var seat = db.seats.First(s => !s.IsReserved);

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

        var hasFree = JsonSerializer.Deserialize<bool>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.True(hasFree);
    }

    [Fact]
    public async Task SelectTicketType()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var screening = db.filmScreenings.First();

        var response = await _client.GetAsync($"/api/cinema/selecttickettype?screeningId={screening.FilmScreeningId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var ticket = JsonSerializer.Deserialize<TicketDto>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(ticket);
    }

    /*
    [Fact]
    public async Task SetQuantity()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var cart = db.carts.Include(c => c.Ticket).First();
        var newAmount = 3;

        var response = await _client.PutAsync($"/api/cinema/setquantity?cartId={cart.CartId}&amount={newAmount}", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updatedCart = db.carts.First(c => c.CartId == cart.CartId);
        Assert.Equal(newAmount, updatedCart.Amount);
        Assert.Equal(updatedCart.Ticket.TicketPrice * newAmount, updatedCart.TotalPrice);
    }
    */


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