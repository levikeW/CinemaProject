using CinemaProject.Dto;
using CinemaProject_Avalonia.Dto;
using CinemaProject_Avalonia.Models;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;

namespace CinemaProject_Avalonia.ViewModels
{
    public class LoginViewModel
    {
        private readonly AuthModel _authModel;
        private readonly ApiSession _session;

        private string _email;
        private string _password;

        private string _registEmail;
        private string _registName;
        private string _registPassword;
        private string _registAddress;

        public AsyncRelayCommand LoginCommand { get; set; }
        public AsyncRelayCommand RegistCommand { get; set; }

        public event EventHandler NavigationToMainRequested;

        public string Email
        {
            get => _email;
            set
            {
                _email = value;
            }
        }

        public string Password
        {
            get => _password;
            set
            {
                _password = value;
            }
        }

        public string RegistEmail
        {
            get => _registEmail;
            set
            {
                _registEmail = value;
            }
        }

        public string RegistName
        {
            get => _registName;
            set
            {
                _registName = value;
            }
        }

        public string RegistPassword
        {
            get => _registPassword;
            set
            {
                _registPassword = value;
            }
        }

        public string RegistAddress
        {
            get => _registAddress;
            set
            {
                _registAddress = value;
            }
        }

        public LoginViewModel(ApiSession session, AuthModel model)
        {
            _session = session;
            _authModel = model;

            LoginCommand = new AsyncRelayCommand(Login);
            //RegistCommand = new AsyncRelayCommand(Regist);
        }

        private async Task Login()
        {
            try
            {
                var loginDto = new { email = Email, password = Password };
                var response = await _session.Client.PostAsJsonAsync("api/user/login", loginDto);

                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<LoginResponse>();

                    if (result != null)
                    {
                        if (result.Role == "Admin")
                        {
                            Debug.WriteLine("Admin login OK");
                            NavigationToMainRequested?.Invoke(this, EventArgs.Empty);
                        }
                        else
                        {
                            Debug.WriteLine("Login failed: Only Admin users can log in.");

                           // ErrorMessage = "Hiba: csak admin felhasználók tudnak belépni.";
                        }
                    }
                    else
                    {
                        Debug.WriteLine("Login failed: Invalid response from server.");
                        //ErrorMessage = "Hiba: érvénytelen szerver válasz.";
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Login exception: {ex.Message}");
            }
        }


        /*   private async Task Regist()
           {
               // NavigationToMainRequested?.Invoke(this, EventArgs.Empty);
               if (string.IsNullOrWhiteSpace(RegistEmail) ||
                   string.IsNullOrWhiteSpace(RegistName) ||
                   string.IsNullOrWhiteSpace(RegistPassword) ||
                   string.IsNullOrWhiteSpace(RegistAddress))
                   return;
               try
               {
                   var registerDto = new
                   {
                       Email = RegistEmail,
                       Password = RegistPassword,
                       FullName = RegistName,
                       BillingAddress = RegistAddress
                   };

                   var response = await _session.Client.PostAsJsonAsync("api/user/regist?IsAdmin=false", registerDto);

                   if (response.IsSuccessStatusCode)
                   {
                       Console.WriteLine("Registration OK");
                       await Login();
                   }
                   else
                   {
                       var text = await response.Content.ReadAsStringAsync();
                       Console.WriteLine($"Registration failed: {response.StatusCode} - {text}");
                   }
               }
               catch (Exception ex)
               {
                   Console.WriteLine($"Registration exception: {ex.Message}");
               }
           }*/
    }
}

