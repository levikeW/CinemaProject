using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using Cinema.Dto;
using CinemaProject.Dto;

namespace CinemaProject_Avalonia.Models
{
    public class MainWindowModel
    {
        private readonly HttpClient _client;
        private readonly ApiSession _session;
        public MainWindowModel(ApiSession session)
        {
            _session = session;
            _client = _session.Client;
        }


        // ===================== MOVIES =====================

        public async Task<List<MovieDto>> GetAllMovies()
        {
            return await _client.GetFromJsonAsync<List<MovieDto>>("api/cinema/getallmovies");
        }

        public async Task<List<MovieDto>> SearchMoviesByTitle(string title)
        {
            return await _client.GetFromJsonAsync<List<MovieDto>>($"api/cinema/searchmoviebytitle?item={title}");
        }

        public async Task NewMovie(NewMovieDto dto)
        {
            var response = await _client.PostAsJsonAsync("/newmovie", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task ModifyMovie(MovieDto dto, int movieId)
        {
            var response = await _client.PutAsJsonAsync($"/modifymovie?movieId={movieId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteMovie(int movieId)
        {
            var response = await _client.DeleteAsync($"/deletemovie?movieId={movieId}");
            response.EnsureSuccessStatusCode();
        }

        // ===================== SCREENINGS =====================

        public async Task<List<FilmScreeningDto>> GetAllScreenings()
        {
            return await _client.GetFromJsonAsync<List<FilmScreeningDto>>("api/cinema/getallscreenings");
        }

        public async Task<List<FilmScreeningDto>> GetScreeningDetails(DateTimeOffset time)
        {
            return await _client.GetFromJsonAsync<List<FilmScreeningDto>>($"api/cinema/getscreeningdetails?time={time}");
        }

        public async Task<List<FilmScreeningDto>> GetUpcomingScreenings()
        {
            return await _client.GetFromJsonAsync<List<FilmScreeningDto>>("api/cinema/getupcomingscreenings");
        }

        public async Task NewScreening(NewScreeningDto dto)
        {
            var response = await _client.PostAsJsonAsync("/newscreening", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task ModifyFilmScreening(FilmScreeningDto dto, int screeningId)
        {
            var response = await _client.PutAsJsonAsync($"/modifyfilmscreening?screeningId={screeningId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteScreening(int screeningId)
        {
            var response = await _client.DeleteAsync($"/deletescreening?screeningId={screeningId}");
            response.EnsureSuccessStatusCode();
        }

        // ===================== TICKETS =====================

        public async Task<List<TicketDto>> GetAllTickets()
        {
            return await _client.GetFromJsonAsync<List<TicketDto>>("api/cinema/getallticket");
        }

        public async Task ModifyTicket(TicketDto dto, int ticketId)
        {
            var response = await _client.PutAsJsonAsync($"/modifyticket?ticketId={ticketId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task<TicketDto> SelectTicketType(int screeningId)
        {
            return await _client.GetFromJsonAsync<TicketDto>($"api/cinema/selecttickettype?screeningId={screeningId}");
        }

        // ===================== USERS (ADMIN) =====================

        public async Task<List<UserDto>> GetAllUsers()
        {
            return await _client.GetFromJsonAsync<List<UserDto>>("/getalluser");
        }

        public async Task<List<UserDto>> SearchUser(string item)
        {
            return await _client.GetFromJsonAsync<List<UserDto>>($"/searchuser?item={item}");
        }

        public async Task DeleteUser(int userId)
        {
            var response = await _client.DeleteAsync($"/deleteuser?userId={userId}");
            response.EnsureSuccessStatusCode();
        }

        public async Task ChangeRole(int userId)
        {
            var response = await _client.PutAsync($"/changerole?userId={userId}", null);
            response.EnsureSuccessStatusCode();
        }

        // ===================== RESERVATIONS =====================

        public async Task<List<PaymentReservationDto>> GetAllReservations()
        {
            return await _client.GetFromJsonAsync<List<PaymentReservationDto>>("/getallreservation");
        }

        public async Task ModifyReservation(PaymentReservationDto dto, int reservationId)
        {
            var response = await _client.PutAsJsonAsync($"/modifyreservation?reservationId={reservationId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteReservation(int reservationId)
        {
            var response = await _client.DeleteAsync($"/deletereservation?reservationId={reservationId}");
            response.EnsureSuccessStatusCode();
        }

        // ===================== IMAGE =====================

        public async Task UploadImage(ImageDto dto)
        {
            var response = await _client.PostAsJsonAsync("/uploadimage", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteImage(int imageId)
        {
            var response = await _client.DeleteAsync($"/deleteimage?imageId={imageId}");
            response.EnsureSuccessStatusCode();
        }

        public async Task<ImageDto> GetImage(int movieId)
        {
            return await _client.GetFromJsonAsync<ImageDto>($"api/cinema/getimage?movieId={movieId}");
        }
    }
}