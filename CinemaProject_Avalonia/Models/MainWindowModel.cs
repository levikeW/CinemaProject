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
using CinemaProject.Persistence;

namespace CinemaProject_Avalonia.Models
{
    public class MainWindowModel
    {
        public readonly ApiSession _session;
        public MainWindowModel(ApiSession session)
        {
            _session = session;

        }

        // ===================== MOVIES =====================

        public async Task<List<MovieDto>> GetAllMovies()
        {
            return await _session.Client.GetFromJsonAsync<List<MovieDto>>("/api/cinema/getallmovies");
        }

        public async Task<List<MovieDto>> SearchMoviesByTitle(string title)
        {
            return await _session.Client.GetFromJsonAsync<List<MovieDto>>($"api/cinema/searchmoviebytitle?item={title}");
        }

        public async Task NewMovie(NewMovieDto dto)
        {
            var response = await _session.Client.PostAsJsonAsync("api/admin/newmovie", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task ModifyMovie(ModifyMovieDto dto, int movieId)
        {
            var response = await _session.Client.PutAsJsonAsync($"api/admin/modifymovie?movieId={movieId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteMovie(int movieId)
        {
            var response = await _session.Client.DeleteAsync($"api/admin/deletemovie?movieId={movieId}");
            response.EnsureSuccessStatusCode();
        }

        // ===================== SCREENINGS =====================

        public async Task<List<FilmScreeningDto>> GetAllScreenings()
        {
            return await _session.Client.GetFromJsonAsync<List<FilmScreeningDto>>("/api/cinema/getallscreenings");
        }

        public async Task<List<FilmScreeningDto>> GetScreeningDetails(DateTimeOffset time)
        {
            return await _session.Client.GetFromJsonAsync<List<FilmScreeningDto>>($"api/cinema/getscreeningdetails?time={time}");
        }

        public async Task<NewScreeningDto> NewScreening(NewScreeningDto dto)
        {
            var response = await _session.Client.PostAsJsonAsync("api/admin/newscreening", dto);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<NewScreeningDto>();
            return result!;
        }

        public async Task ModifyFilmScreening(ModifyFilmScreeningDto dto, int screeningId)
        {
            var response = await _session.Client.PutAsJsonAsync($"api/admin/modifyfilmscreening?screeningId={screeningId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteScreening(int screeningId)
        {
            var response = await _session.Client.DeleteAsync($"api/admin/deletescreening?screeningId={screeningId}");
            response.EnsureSuccessStatusCode();
        }

        // ===================== TICKETS =====================

        public async Task<List<TicketDto>> GetAllTickets()
        {
            return await _session.Client.GetFromJsonAsync<List<TicketDto>>("api/cinema/getallticket");
        }

        public async Task ModifyTicket(ModifyTicketDto dto, int ticketId)
        {
            var response = await _session.Client.PutAsJsonAsync($"api/admin/modifyticket?ticketId={ticketId}", dto);
            response.EnsureSuccessStatusCode();
        }

        // ==================== ROOMS ====================

        public async Task<List<RoomDto>> GetAllRooms()
        {
            return await _session.Client.GetFromJsonAsync<List<RoomDto>>("/api/cinema/getallrooms");
        }

        public async Task<NewRoomDto> NewRoom(NewRoomDto dto)
        {
            var response = await _session.Client.PostAsJsonAsync("api/admin/newroom", dto);
            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<NewRoomDto>();
            return result!;
        }

        public async Task ModifyRoom(ModifyRoomDto dto, int roomId)
        {
            var response = await _session.Client.PutAsJsonAsync($"api/admin/modifyroom?roomId={roomId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteRoom(int roomId)
        {
            var response = await _session.Client.DeleteAsync($"api/admin/deleteroom?roomId={roomId}");
        }

        // ===================== USERS (ADMIN) =====================

        public async Task<List<UserDto>> GetAllUsers()
        {
            return await _session.Client.GetFromJsonAsync<List<UserDto>>("/api/admin/getalluser");
        }

        public async Task<List<UserDto>> SearchUser(string item)
        {
            return await _session.Client.GetFromJsonAsync<List<UserDto>>($"api/admin/searchuser?item={item}");
        }

        public async Task DeleteUser(int userId)
        {
            var response = await _session.Client.DeleteAsync($"api/admin/deleteuser?userId={userId}");
            response.EnsureSuccessStatusCode();
        }

        public async Task ChangeRole(int userId, string newRole, int actAdminId)
        {
            var response = await _session.Client.PutAsync($"api/admin/changerole?userId={userId}&newRole={newRole}&actAdminId={actAdminId}", null);
            response.EnsureSuccessStatusCode();
        }

        // ===================== RESERVATIONS =====================

        public async Task<List<PaymentReservationDto>> GetAllReservations()
        {
            return await _session.Client.GetFromJsonAsync<List<PaymentReservationDto>>("/api/admin/getallreservation");
        }

        public async Task ModifyReservation(ModifyReservationDto dto, int reservationId)
        {
            var response = await _session.Client.PutAsJsonAsync($"api/admin/modifyreservation?reservationId={reservationId}", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteReservation(int reservationId)
        {
            var response = await _session.Client.DeleteAsync($"api/admin/deletereservation?reservationId={reservationId}");
            response.EnsureSuccessStatusCode();
        }

        // ===================== IMAGE =====================

        public async Task UploadImage(ImageDto dto)
        {
            var response = await _session.Client.PostAsJsonAsync("api/admin/uploadimage", dto);
            response.EnsureSuccessStatusCode();
        }

        public async Task DeleteImage(int imageId)
        {
            var response = await _session.Client.DeleteAsync($"api/admin/deleteimage?imageId={imageId}");
            response.EnsureSuccessStatusCode();
        }

        public async Task<ImageDto> GetImage(int movieId)
        {
            return await _session.Client.GetFromJsonAsync<ImageDto>($"api/cinema/getimage?movieId={movieId}");
        }
    }
}