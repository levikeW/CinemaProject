using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Avalonia.Media.Imaging;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using CinemaProject_Avalonia.Models;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NpgsqlTypes;

namespace CinemaProject_Avalonia.ViewModels
{
    public class MovieViewModel : ViewModelBase
    {
        private readonly MainWindowViewModel _viewModel;

        private int _movieId;
        private string _movieTitle;
        private int _duration;
        private string _genre;
        private string _director;
        private string _description;
        private int _imageId;
        private MovieStatus _status;

        private Bitmap? _movieImage;

        private string _errorMessage;

        public RelayCommand OpenEditPanelCommand { get; }
        public RelayCommand DeleteCommand { get; }
        public AsyncRelayCommand SaveMovieCommand { get; }

        public event EventHandler<NewMovieDto> MovieAddSaved;
        public event EventHandler<ModifyMovieDto> MovieEditSaved;
        public event EventHandler? MovieDeleted;

        public int MovieId
        {
            get => _movieId;
            set
            {
                _movieId = value;
                OnPropertyChanged();
            }
        }
        public string MovieTitle
        {
            get => _movieTitle;
            set
            {
                _movieTitle = value;
                OnPropertyChanged();
            }
        }

        public int Duration
        {
            get => _duration;
            set
            {
                _duration = value;
                OnPropertyChanged();
            }
        }

        public string Genre
        {
            get => _genre;
            set
            {
                _genre = value;
                OnPropertyChanged();
            }
        }

        public string Director
        {
            get => _director;
            set
            {
                _director = value;
                OnPropertyChanged();
            }
        }

        public string Description
        {
            get => _description;
            set
            {
                _description = value;
                OnPropertyChanged();
            }
        }

        public int ImageId
        {
            get => _imageId;
            set
            {
                _imageId = value;
                OnPropertyChanged();
            }
        }

        public MovieStatus Status
        {
            get => _status;
            set
            {
                _status = value;
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

        public IEnumerable<MovieStatus> MovieStatuses
        {
            get
            {
                // Enum.GetValues visszaadja az összes értéket object[] tömbben
                var values = Enum.GetValues(typeof(MovieStatus));

                // Cast segítségével konvertáljuk MovieStatus típusra, majd IEnumerable-ként adjuk vissza
                return values.Cast<MovieStatus>();
            }
        }

        public MovieViewModel(MainWindowViewModel viewModel)
        {
            _viewModel = viewModel;

            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            SaveMovieCommand = new AsyncRelayCommand(SaveMovie);
            DeleteCommand = new RelayCommand(Delete);
        }

        public async Task SaveMovie()
        {
            try
            {
                if (string.IsNullOrWhiteSpace(MovieTitle))
                {
                    ErrorMessage = "A film címét kötelező megadni.";
                    return;
                }

                if (MovieId == 0)
                {
                    var addDto = new NewMovieDto
                    {
                        MovieTitle = MovieTitle,
                        Duration = Duration,
                        Genre = Genre,
                        Director = Director,
                        Description = Description,
                        ImageId = ImageId,
                        Status = Status
                    };

                    MovieAddSaved?.Invoke(this, addDto);
                }
                else
                {
                    var modifyDto = new ModifyMovieDto
                    {
                        MovieId = MovieId,
                        MovieTitle = MovieTitle,
                        Duration = Duration,
                        Genre = Genre,
                        Director = Director,
                        Description = Description,
                        ImageId = ImageId,
                        Status = Status
                    };

                    MovieEditSaved?.Invoke(this, modifyDto);
                }

                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a film mentésekor: " + ex.Message;
            }
        }

        private void OpenEditPanel()
        {
            _viewModel.SelectedMovieItem = this;
            _viewModel.IsMovieEditPanelOpen = true;
            _viewModel.IsMovieAddPanelOpen = false;
        }

        private void Delete()
        {
            MovieDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
