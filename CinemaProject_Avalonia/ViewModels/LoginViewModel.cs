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

        public LoginViewModel(AuthModel model)
        {
            _authModel = model;

            LoginCommand = new AsyncRelayCommand(Login);
        }

        private async Task Login()
        {
            try
            {
                var loginDto = new LoginDto
                {
                    email = Email,
                    password = Password
                };

                var response = await _authModel.Login(loginDto);

                if (!response.IsSuccessStatusCode)
                {
                    ErrorMessage = "Hibás email vagy jelszó.";
                    return;
                }

                if (_authModel._session.Role != "Admin")
                {
                    ErrorMessage = "Csak admin léphet be.";
                    return;
                }

                MainWindowViewModel mainVm = new MainWindowViewModel(new MainWindowModel(_authModel._session));
                mainVm.CurrentAdminId = _authModel._session.Userid;

                NavigationToMainRequested?.Invoke(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                ErrorMessage = "Szerver hiba történt.";
                Debug.WriteLine(ex.Message);
            }
        }
    }
}

