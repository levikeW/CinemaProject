using CommunityToolkit.Mvvm.Input;
using Cinema.Dto;
using System;
using System.Collections.ObjectModel;
using System.Windows.Input;

namespace CinemaProject_Avalonia.ViewModels
{
    public class ScreeningsViewModel : ViewModelBase
    {
        private readonly MainWindowViewModel _mainViewModel;

        public int FilmScreeningId { get; set; } = 0;
        public int MovieId { get; set; } = 0;
        public int RoomId { get; set; } = 0;
        public MovieDto Movie { get; set; } = new MovieDto();

        private string _title { get; set; } = "";
        private string _room { get; set; } = "";
        public ObservableCollection<DateTimeOffset> ShowTimes { get; set; } = new();

        public event EventHandler? ScreeningDeleted;
        public event EventHandler? ScreeningEdit;

        public ICommand OpenEditPanelCommand { get; }
        public ICommand DeleteCommand { get; }

        public string Title
        {
            get => _title;
            set 
            {
                _title = value; 
                OnPropertyChanged(nameof(Title));
            }
        }

        public string Room
        {
            get => _room;
            set 
            { 
                _room = value; 
                OnPropertyChanged(nameof(Room)); 
            }
        }

        public ScreeningsViewModel(MainWindowViewModel mainViewModel)
        {
            _mainViewModel = mainViewModel;
            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            DeleteCommand = new RelayCommand(Delete);
        }

        private void OpenEditPanel()
        {
            _mainViewModel.SelectedScreening = this;
            _mainViewModel.IsEditPanelOpen = true;
        }

        private void Delete()
        {
            ScreeningDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}