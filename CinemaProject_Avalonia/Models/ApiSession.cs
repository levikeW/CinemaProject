using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace CinemaProject_Avalonia.Models
{
    public class ApiSession
    {
        public int Userid { get; set; }
        public string Username { get; set; }

        public string Role { get; set; }

        public HttpClient Client { get; set; }
        public CookieContainer Cookies { get; }
        public ApiSession(string url)
        {
            Cookies = new CookieContainer();
            var handler = new HttpClientHandler
            {
                UseCookies = true,
                CookieContainer = Cookies
            };

            Client = new HttpClient(handler)
            {
                BaseAddress = new Uri(url)
            };
        }

    }
}
