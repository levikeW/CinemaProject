using CinemaProject_Avalonia.Models;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Input;

namespace CinemaProject_Avalonia.ViewModels
{
    public class MovieViewModel : ViewModelBase
    {
        public MainWindowViewModel _viewModel;

        private string _title { get; set; } = "";
        private string _category { get; set; } = "";
        private string _room { get; set; } = "";
        private DateTimeOffset _selectedDate;

        public event EventHandler? MovieDeleted;
        public event EventHandler? MovieEdit;

        public ObservableCollection<DateTimeOffset> ShowTimes { get; set; } = new();

        public RelayCommand EditCommand { get; }
        public RelayCommand OpenEditPanelCommand { get; set; }
        public RelayCommand DeleteCommand { get; }


        public string Title
        {
            get => _title;
            set
            {
                _title = value;
                OnPropertyChanged();
            }
        }

        public string Category
        {
            get => _category;
            set
            {
                _category = value;
                OnPropertyChanged();
            }
        }
        public string Room
        {
            get => _room;
            set
            {
                _room = value;
                OnPropertyChanged();
            }
        }

        public DateTimeOffset SelectedDate
        {
            get => _selectedDate;
            set
            {
                _selectedDate = value;
                OnPropertyChanged();
            }
        }

        public MovieViewModel(MainWindowViewModel viewModel)
        {
            _viewModel = viewModel;
            EditCommand = new RelayCommand(Edit);
            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            DeleteCommand = new RelayCommand(Delete);
        }

        private void Edit()
        {
            MovieEdit?.Invoke(this, EventArgs.Empty);
        }

        private void OpenEditPanel()
        {
            System.Diagnostics.Debug.WriteLine("KATTINTÁS OK");
            _viewModel.SelectedMovie = this;
            _viewModel.IsEditPanelOpen = true;
        }

        private void Delete()
        {
            MovieDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
