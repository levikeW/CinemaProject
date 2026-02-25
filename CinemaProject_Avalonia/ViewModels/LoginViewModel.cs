using CinemaProject.Dto;
using CinemaProject_Avalonia.Dto;
using CinemaProject_Avalonia.Models;
using CommunityToolkit.Mvvm.Input;
using Microsoft.EntityFrameworkCore.Metadata;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Diagnostics.Eventing.Reader;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;

namespace CinemaProject_Avalonia.ViewModels
{
    public class LoginViewModel : ViewModelBase
    {
        private readonly AuthModel _authModel;
        private readonly ApiSession _session;

        private string _email;
        private string _password;

        private string _errorMessage;

        public AsyncRelayCommand LoginCommand { get; set; }
        public AsyncRelayCommand RegistCommand { get; set; }

        public event EventHandler NavigationToMainRequested;

        public bool HasError
        { 
            get => !string.IsNullOrEmpty(ErrorMessage);
        }

        public string Email
        {
            get => _email;
            set
            {
                _email = value;
                OnPropertyChanged();
            }
        }

        public string Password
        {
            get => _password;
            set
            {
                _password = value;
                OnPropertyChanged();
            }
        }

        public string ErrorMessage
        {
            get => _errorMessage;
            set
            {
                _errorMessage = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(HasError));
            }
        }

        public LoginViewModel(ApiSession session, AuthModel model)
        {
            _session = session;
            _authModel = model;

            LoginCommand = new AsyncRelayCommand(Login);
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
                            ErrorMessage = "Hiba: csak admin felhasználók tudnak belépni.";
                            Debug.WriteLine("Login failed: Only Admin users can log in.");
                        }
                    }
                    else
                    {
                        ErrorMessage = "Hiba: érvénytelen szerver válasz.";
                        Debug.WriteLine("Login failed: Invalid response from server.");
                    }
                }
                else
                {
                    ErrorMessage = "Hiba: érvénytelen szerver válasz.";
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = "Szerver hiba történt.";
                Debug.WriteLine($"Login exception: {ex.Message}");
            }
        }
    }
}

