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
        public ObservableCollection<string> Categories { get; set; } = new();
        public ObservableCollection<string> Rooms { get; set; } = new();
        public ObservableCollection<PriceViewModel> Prices { get; set; }
        public ObservableCollection<CategoryViewModel> Category { get; set; }
        private CategoryViewModel? _selectedCategoryItem { get; set; }
        private PriceViewModel? _selectedPriceItem { get; set; }

        private string _selectedCategory;
        private string _selectedRoom;
        private MovieViewModel? _selectedMovie;
        private DateTimeOffset _selectedDate = DateTime.Today;
        private string _searchText = "";
        private string _errorMessage;

        public bool HasError { get => !string.IsNullOrEmpty(ErrorMessage); }

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

        public ObservableCollection<MovieViewModel> FilteredMovies { get; set; } = new();

        public string SelectedCategory
        {
            get => _selectedCategory;
            set
            {
                _selectedCategory = value;
                OnPropertyChanged();
                if (SelectedMovie != null)
                {
                    if (value == "Mind" || SelectedMovie.Category == value)
                    {
                        ErrorMessage = "";
                    }
                }
                ApplyFilters();
            }
        }

        public string SelectedRoom
        {
            get => _selectedRoom;
            set
            {
                _selectedRoom = value;
                OnPropertyChanged();
                if (SelectedMovie != null)
                {
                    if (value == "Csillagfény Terem" || SelectedMovie.Room == value)
                    {
                        ErrorMessage = "";
                    }
                }
            }
        }

        public MovieViewModel? SelectedMovie
        {
            get => _selectedMovie;
            set
            {
                _selectedMovie = value;
                OnPropertyChanged();

                if (value != null && !IsPricesPageOpen && !IsCategoriesPageOpen)
                {
                    if (SelectedCategory == "Mind" || value.Category == SelectedCategory)
                    {
                        ErrorMessage = "";
                        IsEditPanelOpen = false;
                    }
                    if (SelectedRoom == "Csillagfény Terem" || value.Room == SelectedRoom)
                    {
                        ErrorMessage = "";
                        IsEditPanelOpen = false;
                    }
                    else
                    {
                        IsEditPanelOpen = false;
                        ErrorMessage = $"Hiba: A(z) '{value.Title}' nem '{SelectedCategory}' kategóriájú!";
                    }
                    ApplyFilters();
                }
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
                OnPropertyChanged(nameof(IsEditPanelOpen));
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

        public MainWindowViewModel()
        {

            _mainWindowModel = new MainWindowModel("https://localhost:7199");
            Movies = new ObservableCollection<MovieViewModel>();
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

            AddMovie();

            Prices.Add(new PriceViewModel(this) { Name = "Normál", Amount = 3000 });
            Prices.Add(new PriceViewModel(this) { Name = "Kedvezményes(Diák)", Amount = 2500 });
            Prices.Add(new PriceViewModel(this) { Name = "Kedvezményes(Nyugdíjas)", Amount = 2500 });
            Prices.Add(new PriceViewModel(this) { Name = "Családi", Amount = 10000 });
            Prices.Add(new PriceViewModel(this) { Name = "Gyermek", Amount = 2500 });
            Prices.Add(new PriceViewModel(this) { Name = "Mozgássérült", Amount = 2000 });


            var alapKategoriak = new List<string> {"Sci-Fi", "Akció", "Dráma", "Romantikus", "Thriller", "Horror", "Vígjáték", "Animációs" };

            var termek = new List<string> { "Csillagfény Terem", "Panoráma Terem", "Ezüstvászon Terem" };

            foreach (var nev in alapKategoriak)
            {
                var catVM = new CategoryViewModel(this) { Name = nev };
                Category.Add(catVM);
                Categories.Add(nev);
            };

            foreach (var nev in termek)
            {
                Rooms.Add(nev);
            };

            _selectedCategory = "Mind";
            SearchText = "";

            IsMenuOpen = false;
            IsEditPanelOpen = false;
        }
        public async Task LoadAsync()
        {
            try
            {
                Movies.Clear();

                var screenings = await _mainWindowModel.GetAllScreenings();

                foreach (var screening in screenings)
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

                ApplyFilters();
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba történt az adatok betöltésekor: " + ex.Message;
            }
        }

        public void ToggleMenu()
        {
            System.Diagnostics.Debug.WriteLine("KATTINTÁS OK");
            IsMenuOpen = !IsMenuOpen;
        }

        private void AddMovie()
        {
            var movie = new MovieViewModel(this)
            {
                Title = "Új film címe...",
                Category = Categories.Count > 1 ? Categories[1] : "Sci-Fi",
                Room = Rooms.Count > 1 ? Rooms[1] : "Csillagfény Terem",
            };

            movie.ShowTimes.Add(DateTimeOffset.Now.AddDays(1));

            RegisterMovie(movie);
            Movies.Add(movie);

            IsMenuOpen = false;
            SelectedMovie = movie;
        }

        private void OnMovieDeleted(object? sender, EventArgs e)
        {
            if (sender is MovieViewModel movie)
                Movies.Remove(movie);
            ApplyFilters();
        }

        private void OnMovieEdit(object? sender, EventArgs e)
        {

            if (sender is MovieViewModel movie)
            {
                SelectedMovie = movie;
                IsEditPanelOpen = true;
            }
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
            movie.MovieDeleted += OnMovieDeleted;
            movie.MovieEdit += OnMovieEdit;
            ApplyFilters();
        }

        private void OpenPricesPage()
        {
            IsMenuOpen = false;
            IsPricesPageOpen = true;
            Debug.WriteLine("Árak oldal megnyitva");
        }

        private void ClosePriceEdit()
        {
            IsPricesPageOpen = false;
            IsEditPanelOpen = false;
            SelectedPriceItem = null;
            SelectedMovie = null;
        }
        private void AddPrice()
        {
            var newPrice = new PriceViewModel(this)
            {
                Name = "Új ár",
                Amount = 0
            };
            newPrice.PriceDeleted += (s, e) => Prices.Remove(newPrice);

            Prices.Add(newPrice);
            SelectedPriceItem = newPrice;
            IsEditPanelOpen = true;
        }
        private void OpenCategoriesPage()
        {
            IsMenuOpen = false;
            IsCategoriesPageOpen = true;
            Debug.WriteLine("Kategóriák oldal megnyitva");
        }

        private void CloseCategoryEdit()
        {
            IsCategoriesPageOpen = false;
            IsEditPanelOpen = false;
            SelectedCategoryItem = null;
            SelectedMovie = null;
        }

        private void AddCategory()
        {
            var newCategory = new CategoryViewModel(this)
            {
                Name = "Új kategória"
            };
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
            ErrorMessage = "";
            FilteredMovies.Clear();

            if (SelectedMovie != null && SelectedCategory != "Mind" && SelectedMovie.Category != SelectedCategory)
            {
                ErrorMessage = $"Hiba: A(z) '{SelectedMovie.Title}' nem '{SelectedCategory}' kategóriájú film!";
                return;
            }

            foreach (var movie in Movies)
            {
                bool matchesSearch = string.IsNullOrWhiteSpace(SearchText) || movie.Title.ToLower().Contains(SearchText.ToLower());
                bool matchesCategory = string.IsNullOrEmpty(SelectedCategory) || SelectedCategory == "Mind" || movie.Category == SelectedCategory;
                bool matchesDate = !IsDateFilterActive || movie.ShowTimes.Any(d => d.Date == SelectedDate.Date);
                bool matchesOtherFilters = matchesSearch && matchesCategory;

                if (matchesOtherFilters && matchesDate)
                {
                    FilteredMovies.Add(movie);
                }
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

        private async Task GetMoviesAsync()
        {

            List<Cinema.Dto.FilmScreeningDto> movies = await _mainWindowModel.GetAllScreenings();
            foreach (var movie in movies) {

                var movie1 = new MovieViewModel(this) { };

                RegisterMovie(movie1);
                Movies.Add(movie1);
            }
        }
    }
}
