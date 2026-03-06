using Avalonia;
using CinemaProject.Dto;
using CinemaProject_Avalonia.Models;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CinemaProject_Avalonia.ViewModels
{
    public class UserViewModel : ViewModelBase
    {
        public MainWindowModel _model;
        public MainWindowViewModel _viewModel;

        private int _userId;
        private string _email;
        private string _name;
        private string _role;

        private string _errorMessage;

        public RelayCommand OpenEditPanelCommand { get; }
        public AsyncRelayCommand SaveUserCommand { get; }
        public RelayCommand DeleteCommand { get; }

        public event EventHandler? UserSaved;
        public event EventHandler? UserDeleted;

        public int UserId
        {
            get => _userId;
            set
            {
                _userId = value;
                OnPropertyChanged();
            }
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
        public string Name
        {
            get => _name;
            set
            {
                _name = value;
                OnPropertyChanged();
            }
        }
        public string Role
        {
            get => _role;
            set
            {
                _role = value;
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
            }
        }

        public UserViewModel(MainWindowViewModel viewModel, MainWindowModel model)
        {
            _model = model;
            _viewModel = viewModel;

            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            SaveUserCommand = new AsyncRelayCommand(SaveUser);
            DeleteCommand = new RelayCommand(Delete);
        }

        //!
        public async Task SaveUser()
        {
            try
            {
              //  await _model.ChangeRole(UserId);

                UserSaved?.Invoke(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a felhasználó ment: " + ex.Message;
            }
        }

        private void OpenEditPanel()
        {
            _viewModel.SelectedUserItem = this;
            _viewModel.IsScreeningEditPanelOpen = true;
        }

        private void Delete()
        {
            UserDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
