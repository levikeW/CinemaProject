using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
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
            var response = await _client.PostAsJsonAsync("api/admin/newmovie", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task ModifyMovie(MovieDto dto, int movieId)
        {
            var response = await _client.PutAsJsonAsync($"api/admin/modifymovie?movieId={movieId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteMovie(int movieId)
        {
            var response = await _client.DeleteAsync($"api/admin/deletemovie?movieId={movieId}");
            response.EnsureSuccessStatusCode();
        }

        // ===================== SCREENINGS =====================

        public async Task<List<FilmScreeningDto>> GetAllScreenings()
        {
            var response = await _client.GetAsync("getallscreenings");

            Console.WriteLine(response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            Console.WriteLine(content);

            response.EnsureSuccessStatusCode();

            return JsonSerializer.Deserialize<List<FilmScreeningDto>>(content);
        }

        public async Task<List<FilmScreeningDto>> GetScreeningDetails(DateTimeOffset time)
        {
            return await _client.GetFromJsonAsync<List<FilmScreeningDto>>($"api/cinema/getscreeningdetails?time={time}");
        }

        public async Task<List<FilmScreeningDto>> GetUpcomingScreenings()
        {
            return await _client.GetFromJsonAsync<List<FilmScreeningDto>>("api/cinema/getupcomingscreenings");
        }

        public async Task<NewScreeningDto> NewScreening(NewScreeningDto dto)
        {
            var response = await _client.PostAsJsonAsync("api/admin/newscreening", dto);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<NewScreeningDto>();
            return result!;
        }

        public async Task ModifyFilmScreening(FilmScreeningDto dto, int screeningId)
        {
            var response = await _client.PutAsJsonAsync($"api/admin/modifyfilmscreening?screeningId={screeningId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteScreening(int screeningId)
        {
            var response = await _client.DeleteAsync($"api/admin/deletescreening?screeningId={screeningId}");
            response.EnsureSuccessStatusCode();
        }

        // ===================== TICKETS =====================

        public async Task<List<TicketDto>> GetAllTickets()
        {
            return await _client.GetFromJsonAsync<List<TicketDto>>("getallticket");
        }

        public async Task ModifyTicket(TicketDto dto, int ticketId)
        {
            var response = await _client.PutAsJsonAsync($"api/admin/modifyticket?ticketId={ticketId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task<TicketDto> SelectTicketType(int screeningId)
        {
            return await _client.GetFromJsonAsync<TicketDto>($"api/cinema/selecttickettype?screeningId={screeningId}");
        }

        // ===================== USERS (ADMIN) =====================

        public async Task<List<UserDto>> GetAllUsers()
        {
            return await _client.GetFromJsonAsync<List<UserDto>>("api/admin/getalluser");
        }

        public async Task<List<UserDto>> SearchUser(string item)
        {
            return await _client.GetFromJsonAsync<List<UserDto>>($"api/admin/searchuser?item={item}");
        }

        public async Task DeleteUser(int userId)
        {
            var response = await _client.DeleteAsync($"api/admin/deleteuser?userId={userId}");
            response.EnsureSuccessStatusCode();
        }

        public async Task ChangeRole(int userId)
        {
            var response = await _client.PutAsync($"api/admin/changerole?userId={userId}", null);
            response.EnsureSuccessStatusCode();
        }

        // ===================== RESERVATIONS =====================

        public async Task<List<PaymentReservationDto>> GetAllReservations()
        {
            return await _client.GetFromJsonAsync<List<PaymentReservationDto>>("api/admin/getallreservation");
        }

        public async Task ModifyReservation(PaymentReservationDto dto, int reservationId)
        {
            var response = await _client.PutAsJsonAsync($"api/admin/modifyreservation?reservationId={reservationId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteReservation(int reservationId)
        {
            var response = await _client.DeleteAsync($"api/admin/deletereservation?reservationId={reservationId}");
            response.EnsureSuccessStatusCode();
        }

        // ===================== IMAGE =====================

        public async Task UploadImage(ImageDto dto)
        {
            var response = await _client.PostAsJsonAsync("api/admin/uploadimage", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteImage(int imageId)
        {
            var response = await _client.DeleteAsync($"api/admin/deleteimage?imageId={imageId}");
            response.EnsureSuccessStatusCode();
        }

        public async Task<ImageDto> GetImage(int movieId)
        {
            return await _client.GetFromJsonAsync<ImageDto>($"api/cinema/getimage?movieId={movieId}");
        }
    }
}