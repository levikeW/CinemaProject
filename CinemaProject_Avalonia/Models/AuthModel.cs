using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using Cinema.Dto;
using CinemaProject.Dto;

namespace CinemaProject_Avalonia.Models
{
    public class AuthModel
    {
        private readonly ApiSession _session;

        public AuthModel(ApiSession session)
        {
            _session = session;
        }
        private async Task<MyDataDto> ViewProfile()
        {
            return await _session.Client.GetFromJsonAsync<MyDataDto>("api/user/getmydata");
        }

        public async Task Login(LoginDto dto)
        {
            var res = await _session.Client.PostAsJsonAsync("api/user/login", dto);

            var user = await ViewProfile();
            _session.Userid = Convert.ToInt32(user.UserId);
            _session.Username = user.Email;
            _session.Role = user.Role;
        }

        public async Task Logout()
        {
            var res = await _session.Client.PostAsync("api/user/logout", null);

            res.EnsureSuccessStatusCode();
            _session.Userid = 0;
            _session.Username = "";
            _session.Role = "";

        }

        public async Task Regist(RegistDto dto, string role)
        {
            var res = await _session.Client.PostAsJsonAsync($"api/user/Regist", dto);
            res.EnsureSuccessStatusCode();
        }

        public async Task<List<UserDto>> GetUsers()
        {
            var res = await _session.Client.GetFromJsonAsync<List<UserDto>>("api/admin/getalluser");
            return res.ToList();
        }
    }
}
