using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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
        private readonly MainWindowModel _model;

        private string _movieTitle;
        private int _duration;
        private string _genre;
        private string _director;
        private string _description;
        private int _imageId;
        private MovieStatus _status;

        private string _errorMessage;

        public event EventHandler? MovieSaved;

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

        public AsyncRelayCommand SaveMovieCommand { get; }

        public MovieViewModel(MainWindowModel model)
        {
            _model = model;

            SaveMovieCommand = new AsyncRelayCommand(SaveMovie);
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

                var dto = new NewMovieDto
                {
                    MovieTitle = MovieTitle,
                    Duration = Duration,
                    Genre = Genre,
                    Director = Director,
                    Description = Description,
                    ImageId = ImageId,
                    Status = Status
                };

                await _model.NewMovie(dto);

                MovieSaved?.Invoke(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a film mentésekor: " + ex.Message;
            }
        }
    }
}
