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
        public MainWindowViewModel _viewModel;
        private string _email;

        private string _name;
        private string _role;

        public event EventHandler? UserDeleted;

        public RelayCommand OpenEditPanelCommand { get; }
        public RelayCommand DeleteCommand { get; }

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

        public UserViewModel(MainWindowViewModel viewModel)
        {
            _viewModel = viewModel;

            _email = Email;
            _name = Name;
            _role = Role;

            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            DeleteCommand = new RelayCommand(Delete);
        }

        private void OpenEditPanel()
        {
            _viewModel.SelectedUserItem = this;
            _viewModel.IsEditPanelOpen = true;
        }

        private void Delete()
        {
            UserDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
