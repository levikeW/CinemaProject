using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CinemaProject.Dto;
using CinemaProject_Avalonia.Models;
using CommunityToolkit.Mvvm.Input;

namespace CinemaProject_Avalonia.ViewModels
{
    public class LoginViewModel
    {
        private readonly AuthModel _authModel;
        private readonly ApiSession _session;

        private string _email;
        private string _password;

        public AsyncRelayCommand RegistCommand { get; set; }
        public AsyncRelayCommand LoginCommand { get; set; }

        public event EventHandler LoginSucceeded;

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

        public LoginViewModel(ApiSession session, AuthModel model)
        {
            _session = session;
            _authModel = model;

            LoginCommand = new AsyncRelayCommand(Login);
        }

        private async Task Login()
        {
            if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password))
                return;

            try
            {
                var dto = new LoginDto
                {
                    email = Email,
                    password = Password
                };

                await _authModel.Login(dto);

                LoginSucceeded?.Invoke(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Login failed: " + ex.Message);
            }
        }


    }
}

