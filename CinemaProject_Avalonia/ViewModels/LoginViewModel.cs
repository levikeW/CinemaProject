using System;
using System.Collections.Generic;
using System.Diagnostics;
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
            RegistCommand = new AsyncRelayCommand(Regist);
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

                Debug.WriteLine("Login successful");
                NavigationToMainRequested?.Invoke(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Login failed: " + ex.Message);
            }
        }

        private async Task Regist()
        {
            if (string.IsNullOrWhiteSpace(RegistEmail) ||
                string.IsNullOrWhiteSpace(RegistName) ||
                string.IsNullOrWhiteSpace(RegistPassword) ||
                string.IsNullOrWhiteSpace(RegistAddress))
                return;

            try
            {
                var dto = new RegistDto
                {
                    Email = RegistEmail,
                    FullName = RegistName,
                    Password = RegistPassword,
                    BillingAddress = RegistAddress
                };

                await _authModel.Regist(dto, "User");

                await _authModel.Login(new LoginDto
                {
                    email = RegistEmail,
                    password = RegistPassword
                });

                RegistEmail = "";
                RegistName = "";
                RegistPassword = "";
                RegistAddress = "";

                Debug.WriteLine("Registration successful");
                NavigationToMainRequested?.Invoke(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Registration failed: " + ex.Message);
            }
        }
    }
}

