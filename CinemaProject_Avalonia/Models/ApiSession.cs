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
        public ApiSession(string url, bool acceptAnyCert = false)
        {
            Cookies = new CookieContainer();

            var handler = new HttpClientHandler
            {
                CookieContainer = Cookies
            };

            if (acceptAnyCert)
            {
                handler.ServerCertificateCustomValidationCallback =
                    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
            }

            Client = new HttpClient(handler)
            {
                Timeout = TimeSpan.FromSeconds(60),
                BaseAddress = new Uri(url)
            };
        }

    }
}
