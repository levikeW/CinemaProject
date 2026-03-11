using CommunityToolkit.Mvvm.Input;
using Cinema.Dto;
using CinemaProject.Dto;
using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Input;
using Avalonia.Media.Imaging;

namespace CinemaProject_Avalonia.ViewModels
{
    public class ScreeningsViewModel : ViewModelBase
    {
        private readonly MainWindowViewModel _mainViewModel;

        private int _filmScreeningId;
        private int _movieId;
        private int _roomId;
        public MovieDto Movie { get; set; } = new MovieDto();

        private string _title = "";
        private string _room = "";
        private string _errorMessage = "";

        private Bitmap? _movieImage;

        public ObservableCollection<DateTimeOffset> ShowTimes { get; set; } = new();

        public event EventHandler? ScreeningDeleted;
        public event EventHandler? ScreeningEdit;
        public event EventHandler<ModifyFilmScreeningDto>? ScreeningSaved;

        public ICommand OpenEditPanelCommand { get; }
        public ICommand DeleteCommand { get; }
        public AsyncRelayCommand SaveScreeningCommand { get; }

        public int FilmScreeningId
        {
            get => _filmScreeningId;
            set
            {
                _filmScreeningId = value;
                OnPropertyChanged();
            }
        }

        public int MovieId
        {
            get => _movieId;
            set
            {
                _movieId = value;
                OnPropertyChanged();
            }
        }

        public int RoomId
        {
            get => _roomId;
            set
            {
                _roomId = value;
                OnPropertyChanged();
            }
        }

        public string Title
        {
            get => _title;
            set
            {
                _title = value;
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

        public Bitmap? MovieImage
        {
            get => _movieImage;
            set
            {
                _movieImage = value;
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

        public ScreeningsViewModel(MainWindowViewModel mainViewModel)
        {
            _mainViewModel = mainViewModel;

            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            DeleteCommand = new RelayCommand(Delete);
            SaveScreeningCommand = new AsyncRelayCommand(SaveScreening);
        }

        private async Task SaveScreening()
        {
            try
            {
                var selectedMovie = _mainViewModel.Movies.FirstOrDefault(m => m.MovieTitle == Title);
                var selectedRoom = _mainViewModel.Room.FirstOrDefault(r => r.Name == Room);

                if (selectedMovie == null)
                {
                    ErrorMessage = "A kiválasztott film nem található.";
                    return;
                }

                if (selectedRoom == null)
                {
                    ErrorMessage = "A kiválasztott terem nem található.";
                    return;
                }

                if (ShowTimes == null || ShowTimes.Count == 0)
                {
                    ErrorMessage = "Legalább egy időpontot adj meg.";
                    return;
                }

                var selectedDate = ShowTimes.First();

                var dto = new ModifyFilmScreeningDto
                {
                    FilmScreeningId = FilmScreeningId,
                    MovieId = selectedMovie.MovieId,
                    MovieTitle = selectedMovie.MovieTitle,
                    RoomId = selectedRoom.RoomId,
                    RoomName = selectedRoom.Name,
                    Date = selectedDate.ToUniversalTime()
                };

                ScreeningSaved?.Invoke(this, dto);
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a vetítés mentésekor: " + ex.Message;
            }
        }

        private void OpenEditPanel()
        {
            _mainViewModel.SelectedScreening = this;
            _mainViewModel.IsScreeningEditPanelOpen = true;
            ScreeningEdit?.Invoke(this, EventArgs.Empty);
        }

        private void Delete()
        {
            ScreeningDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}