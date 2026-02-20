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

        public async Task<List<FilmScreeningDto>> GetScreenings()
        {
            return await _client.GetFromJsonAsync<List<FilmScreeningDto>>("api/cinema/getallscreenings");
        }
    }
}
