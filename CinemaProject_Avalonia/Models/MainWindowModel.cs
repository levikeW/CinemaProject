using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using Cinema.Dto;

namespace CinemaProject_Avalonia.Models
{
    public class MainWindowModel
    {
        private readonly HttpClient _client;

        public MainWindowModel(string port)
        {
            _client = new HttpClient { BaseAddress = new Uri(port) };
        }

        public async Task<List<MovieDto>> GetAllMovies()
        {
            return await _client.GetFromJsonAsync<List<MovieDto>>("api/cinema/getallmovies");
        }

        public async Task<List<FilmScreeningDto>> GetAllScreenings()
        {
            return await _client.GetFromJsonAsync<List<FilmScreeningDto>>("api/cinema/getallscreenings");
        }

        public async Task<List<TicketDto>> GetAllTickets()
        {
            return await _client.GetFromJsonAsync<List<TicketDto>>("api/cinema/getallticket");
        }

        public async Task<List<MovieDto>> SearchMoviesByTitle(string title)
        {
            return await _client.GetFromJsonAsync<List<MovieDto>>($"api/cinema/searchmoviebytitle?item={title}");
        }

        public async Task<List<MovieDto>> SearchMoviesByGenre(string genre)
        {
            return await _client.GetFromJsonAsync<List<MovieDto>>($"api/cinema/searchmoviebygenre?item={genre}");
        }
        public async Task<List<MovieDto>> SearchMovieByDirector(string director)
        {
            return await _client.GetFromJsonAsync<List<MovieDto>>($"api/cinema/searchmoviebydirector?item={director}");
        }
        public async Task<List<FilmScreeningDto>> GetScreeningDetails(DateTimeOffset time)
        {
            return await _client.GetFromJsonAsync<List<FilmScreeningDto>>($"api/cinema/getscreeningdetails?time={time}");
        }
        public async Task<List<FilmScreeningDto>> GetUpcomingScreenings()
        {
            return await _client.GetFromJsonAsync<List<FilmScreeningDto>>("api/cinema/getupcomingscreenings");
        }
        public async Task<bool> IsMovieNowRunning(string movieTitle)
        {
            return await _client.GetFromJsonAsync<bool>($"api/cinema/ismovienowrunning?movieTitle={movieTitle}");
        }
        public async Task<int> GetRoomCapacity(int roomId)
        {
            return await _client.GetFromJsonAsync<int>($"api/cinema/getroomcapacity?roomId={roomId}");
        }
        public async Task<List<SeatDto>> GetSeats(int roomId, int screeningId)
        {
            return await _client.GetFromJsonAsync<List<SeatDto>>($"api/cinema/getseats?roomId={roomId}&screeningId={screeningId}");
        }
        public async Task<bool> IsSeatAvailable(int seatId, int screeningId)
        {
            return await _client.GetFromJsonAsync<bool>($"api/cinema/isseatavailable?seatId={seatId}&screeningId={screeningId}");
        }
        public async Task<TicketDto> SelectTicketType(int screeningId)
        {
            return await _client.GetFromJsonAsync<TicketDto>($"api/cinema/selecttickettype?screeningId={screeningId}");
        }
        public async Task SetQuantity(int cartId, int amount)
        {
            var response = await _client.PutAsync($"api/cinema/setquantity?cartId={cartId}&amount={amount}", null);
            response.EnsureSuccessStatusCode();
        }
        public async Task<ImageDto> GetImage(int movieId)
        {
            return await _client.GetFromJsonAsync<ImageDto>($"api/cinema/getimage?movieId={movieId}");
        }
    }
}
