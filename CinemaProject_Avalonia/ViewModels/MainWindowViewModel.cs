using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using CinemaProject_Avalonia.Models;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace CinemaProject_Avalonia.ViewModels
{
    public partial class MainWindowViewModel : ViewModelBase
    {
        private readonly MainWindowModel _mainWindowModel;

        public ObservableCollection<MovieViewModel> Movies { get; set; } = new();
        public ObservableCollection<MovieViewModel> FilteredMovies { get; set; } = new();
        public ObservableCollection<string> Categories { get; set; } = new();
        public ObservableCollection<string> Rooms { get; set; } = new();
        public ObservableCollection<PriceViewModel> Prices { get; set; } = new();
        public ObservableCollection<CategoryViewModel> Category { get; set; } = new();


        private MovieViewModel? _selectedMovie;
        private CategoryViewModel? _selectedCategoryItem { get; set; }
        private PriceViewModel? _selectedPriceItem { get; set; }
        private string _selectedRoom;
        private DateTimeOffset _selectedDate = DateTime.Today;
        private string _searchText = "";
        private string _errorMessage;


        private bool _isMenuOpen;
        private bool _isEditPanelOpen;
        private bool _isPricesPageOpen;
        private bool _isCategoriesPageOpen;
        private bool _isDateFilterActive = false;


        public RelayCommand ToggleMenuCommand { get; set; }
        public RelayCommand BlockPointerCommand { get; set; }
        public RelayCommand AddMovieCommand { get; set; }
        public RelayCommand CloseEditPanelCommand { get; set; }
        public RelayCommand OpenPricesPageCommand { get; set; }
        public RelayCommand OpenCategoriesPageCommand { get; set; }
        public RelayCommand ClosePriceEditCommand { get; set; }
        public RelayCommand CloseCategoryEditCommand { get; set; }
        public RelayCommand AddPriceCommand { get; set; }
        public RelayCommand AddCategoryCommand { get; set; }
        public RelayCommand AddDateToSelectedMovieCommand { get; set; }
        public RelayCommand<DateTimeOffset> DeleteDateSelectedMovieCommand { get; set; }


        public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

        public string SelectedRoom
        {
            get => _selectedRoom;
            set
            {
                _selectedRoom = value;
                OnPropertyChanged();
                ApplyFilters();
            }
        }

        public MovieViewModel? SelectedMovie
        {
            get => _selectedMovie;
            set
            {
                _selectedMovie = value;
                OnPropertyChanged();
                ApplyFilters();
            }
        }

        public DateTimeOffset SelectedDate
        {
            get => _selectedDate;
            set
            {
                _selectedDate = value;
                OnPropertyChanged();
                ApplyFilters();
            }
        }

        public string SearchText
        {
            get => _searchText;
            set
            {
                _searchText = value;
                OnPropertyChanged();
                ApplyFilters();
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

        public bool IsMenuOpen
        {
            get => _isMenuOpen;
            set
            {
                _isMenuOpen = value;
                OnPropertyChanged();
            }
        }
        public bool IsEditPanelOpen
        {
            get => _isEditPanelOpen;
            set
            {
                _isEditPanelOpen = value;
                OnPropertyChanged();
            }
        }
        public bool IsPricesPageOpen
        {
            get => _isPricesPageOpen;
            set
            {
                _isPricesPageOpen = value;
                OnPropertyChanged();
            }
        }
        public bool IsCategoriesPageOpen
        {
            get => _isCategoriesPageOpen;
            set
            {
                _isCategoriesPageOpen = value;
                OnPropertyChanged();
            }
        }
        public bool IsDateFilterActive
        {
            get => _isDateFilterActive;
            set
            {
                _isDateFilterActive = value;
                OnPropertyChanged();
                ApplyFilters();
            }
        }
        public PriceViewModel? SelectedPriceItem
        {
            get => _selectedPriceItem;
            set
            {
                _selectedPriceItem = value;
                OnPropertyChanged();
            }
        }
        public CategoryViewModel? SelectedCategoryItem
        {
            get => _selectedCategoryItem;
            set
            {
                _selectedCategoryItem = value;
                OnPropertyChanged();
            }
        }


        public MainWindowViewModel(MainWindowModel model)
        {
            _mainWindowModel = model;

            Categories = new ObservableCollection<string>();
            Rooms = new ObservableCollection<string>();
            Prices = new ObservableCollection<PriceViewModel>();
            Category = new ObservableCollection<CategoryViewModel>();

            ToggleMenuCommand = new RelayCommand(ToggleMenu);
            BlockPointerCommand = new RelayCommand(() => { });
            AddMovieCommand = new RelayCommand(AddMovie);
            CloseEditPanelCommand = new RelayCommand(CloseEditPanel);
            AddDateToSelectedMovieCommand = new RelayCommand(AddDateToSelectedMovie);
            DeleteDateSelectedMovieCommand = new RelayCommand<DateTimeOffset>(DeleteDateSelectedMovie);
            OpenPricesPageCommand = new RelayCommand(OpenPricesPage);
            OpenCategoriesPageCommand = new RelayCommand(OpenCategoriesPage);
            ClosePriceEditCommand = new RelayCommand(ClosePriceEdit);
            CloseCategoryEditCommand = new RelayCommand(CloseCategoryEdit);
            AddPriceCommand = new RelayCommand(AddPrice);
            AddCategoryCommand = new RelayCommand(AddCategory);

            _ = LoadAllDataAsync();
        }

        public async Task LoadAllDataAsync()
        {
            LoadRooms();
            await LoadMoviesAsync();
            await LoadTicketsAsync();
        }


        private void LoadRooms()
        {
            var termek = new List<string> { "Csillagfény Terem", "Panoráma Terem", "Ezüstvászon Terem" };
            foreach (var nev in termek) Rooms.Add(nev);
        }

        private async Task LoadTicketsAsync()
        {
            try
            {
                Prices.Clear();

                var tickets = await _mainWindowModel.GetAllTickets();

                foreach (var ticket in tickets)
                {
                    Prices.Add(new PriceViewModel(this)
                    {
                        Name = ticket.TicketType,
                        Amount = ticket.TicketPrice
                    });
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a jegyárak betöltésekor: " + ex.Message;
            }
        }

        public async Task LoadMoviesAsync()
        {
            //Movies.Clear();
            var movie = await _mainWindowModel.GetAllMovies();

            var screenings = await _mainWindowModel.GetAllScreenings();

            foreach (var screening in screenings)
            {
                var existingMovie = Movies.FirstOrDefault(m => m.Title == screening.MovieTitle);

                if (existingMovie == null)
                {
                    var movieVm = new MovieViewModel(this)
                    {
                        Title = screening.MovieTitle,
                        Room = screening.RoomName
                    };

                    movieVm.ShowTimes.Add(screening.Date);
                    RegisterMovie(movieVm);
                    Movies.Add(movieVm);
                }
                else
                {
                    existingMovie.ShowTimes.Add(screening.Date);
                }
            }

            ApplyFilters();
        }

        private void ToggleMenu()
        {
            IsMenuOpen = !IsMenuOpen;
        }

        private void AddMovie()
        {
            var movie = new MovieViewModel(this)
            {
                Title = "Új film címe...",
                Category = Categories.Count > 1 ? Categories[1] : "Sci-Fi",
                Room = Rooms.Count > 1 ? Rooms[1] : "Csillagfény Terem"
            };

            movie.ShowTimes.Add(DateTimeOffset.Now.AddDays(1));
            RegisterMovie(movie);
            Movies.Add(movie);
            IsMenuOpen = false;
            SelectedMovie = movie;
        }

        private void CloseEditPanel()
        {
            IsEditPanelOpen = false;
            SelectedMovie = null;
            ErrorMessage = "";
            ApplyFilters();
        }

        private void RegisterMovie(MovieViewModel movie)
        {
            movie.MovieDeleted += (s, e) => { Movies.Remove(movie); ApplyFilters(); };
            movie.MovieEdit += (s, e) => { SelectedMovie = movie; IsEditPanelOpen = true; };
        }

        private void OpenPricesPage()
        {
            IsMenuOpen = false;
            IsPricesPageOpen = true;
        }

        private void ClosePriceEdit()
        {
            IsPricesPageOpen = false;
            IsEditPanelOpen = false;
            SelectedPriceItem = null;
            SelectedMovie = null;
        }

        private void OpenCategoriesPage()
        {
            IsMenuOpen = false;
            IsCategoriesPageOpen = true;
        }

        private void CloseCategoryEdit()
        {
            IsCategoriesPageOpen = false;
            IsEditPanelOpen = false;
            SelectedCategoryItem = null;
            SelectedMovie = null;
        }

        private void AddPrice()
        {
            var newPrice = new PriceViewModel(this) { Name = "Új ár", Amount = 0 };
            newPrice.PriceDeleted += (s, e) => Prices.Remove(newPrice);
            Prices.Add(newPrice);
            SelectedPriceItem = newPrice;
            IsEditPanelOpen = true;
        }

        private void AddCategory()
        {
            var newCategory = new CategoryViewModel(this) { Name = "Új kategória" };
            newCategory.CategoryDeleted += (s, e) =>
            {
                Categories.Remove(newCategory.Name);
                Category.Remove(newCategory);
            };
            Category.Add(newCategory);
            Categories.Add(newCategory.Name);
            SelectedCategoryItem = newCategory;
            IsMenuOpen = false;
            IsCategoriesPageOpen = true;
        }

        private void ApplyFilters()
        {
            FilteredMovies.Clear();

            foreach (var movie in Movies)
            {
                bool matchesSearch = string.IsNullOrWhiteSpace(SearchText) || movie.Title.ToLower().Contains(SearchText.ToLower());
                bool matchesRoom = string.IsNullOrEmpty(SelectedRoom) || SelectedRoom == "Mind" || movie.Room == SelectedRoom;
                bool matchesDate = !IsDateFilterActive || movie.ShowTimes.Any(d => d.Date == SelectedDate.Date);

                if (matchesSearch && matchesRoom && matchesDate)
                    FilteredMovies.Add(movie);
            }
        }

        private void AddDateToSelectedMovie()
        {
            if (SelectedMovie != null)
            {
                SelectedMovie.ShowTimes.Add(SelectedDate);
            }
        }

        private void DeleteDateSelectedMovie(DateTimeOffset date)
        {
            if (SelectedMovie != null)
            {
                SelectedMovie.ShowTimes.Remove(date);
            }
        }
    }
}
