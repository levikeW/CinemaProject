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

        public ObservableCollection<ScreeningsViewModel> Screenings { get; set; } = new();
        public ObservableCollection<ScreeningsViewModel> FilteredScreenings { get; set; } = new();
        public ObservableCollection<MovieDto> Movies { get; set; } = new();


        public ObservableCollection<string> Rooms { get; set; } = new();
        public ObservableCollection<PriceViewModel> Prices { get; set; } = new();
        //  public ObservableCollection<CategoryViewModel> Category { get; set; } = new();


        private ScreeningsViewModel? _selectedScreening;
        private MovieDto? _selectedMovie;
        private CategoryViewModel? _selectedCategoryItem { get; set; }
        private PriceViewModel? _selectedPriceItem { get; set; }

        private string _selectedRoom;
        private DateTimeOffset _selectedDate = DateTime.Today;
        private string _searchText = "";
        private string _errorMessage;


        private bool _isMenuOpen;
        private bool _isEditPanelOpen;
        private bool _isPricesPageOpen;
        // private bool _isCategoriesPageOpen;
        private bool _isDateFilterActive = false;


        public RelayCommand ToggleMenuCommand { get; set; }
        public RelayCommand BlockPointerCommand { get; set; }
        public AsyncRelayCommand AddNewScreeningCommand { get; set; }
        public RelayCommand CloseEditPanelCommand { get; set; }
        public RelayCommand OpenPricesPageCommand { get; set; }
        public RelayCommand OpenCategoriesPageCommand { get; set; }
        public RelayCommand ClosePriceEditCommand { get; set; }
        public RelayCommand CloseCategoryEditCommand { get; set; }
        public RelayCommand AddPriceCommand { get; set; }
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

        public ScreeningsViewModel? SelectedScreening
        {
            get => _selectedScreening ??= new ScreeningsViewModel(this)
            {
                Title = string.Empty,
                Room = string.Empty,
                ShowTimes = new ObservableCollection<DateTimeOffset>()
            };
            set
            {
                _selectedScreening = value;
                OnPropertyChanged(nameof(SelectedScreening));
                ApplyFilters();
            }
        }

        public MovieDto? SelectedMovie
        {
            get => _selectedMovie;
            set
            {
                _selectedMovie = value;
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
        /* public bool IsCategoriesPageOpen
         {
             get => _isCategoriesPageOpen;
             set
             {
                 _isCategoriesPageOpen = value;
                 OnPropertyChanged();
             }
         }*/
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

            Rooms = new ObservableCollection<string>();
            Prices = new ObservableCollection<PriceViewModel>();
            //  Category = new ObservableCollection<CategoryViewModel>();

            SelectedScreening = new ScreeningsViewModel(this)
            {
                ShowTimes = new ObservableCollection<DateTimeOffset>()
            };

            ToggleMenuCommand = new RelayCommand(ToggleMenu);
            BlockPointerCommand = new RelayCommand(() => { });
            AddNewScreeningCommand = new AsyncRelayCommand(AddNewScreening);
            CloseEditPanelCommand = new RelayCommand(CloseEditPanel);
            AddDateToSelectedMovieCommand = new RelayCommand(AddDateToSelectedMovie);
            DeleteDateSelectedMovieCommand = new RelayCommand<DateTimeOffset>(DeleteDateSelectedMovie);
            OpenPricesPageCommand = new RelayCommand(OpenPricesPage);
            OpenCategoriesPageCommand = new RelayCommand(OpenCategoriesPage);
            ClosePriceEditCommand = new RelayCommand(ClosePriceEdit);
            CloseCategoryEditCommand = new RelayCommand(CloseCategoryEdit);
            AddPriceCommand = new RelayCommand(AddPrice);

            _ = LoadAllDataAsync();
        }

        public async Task LoadAllDataAsync()
        {
            LoadRooms();
            await LoadMoviesForScreeningsAsync();
            await LoadScreeningsAsync();
            await LoadTicketsAsync();
        }


        //!
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

        public async Task LoadMoviesForScreeningsAsync()
        {
            try
            {
                var movies = await _mainWindowModel.GetAllMovies();
                Movies.Clear();

                foreach (var movie in movies)
                {
                    Movies.Add(movie);
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a filmek betöltésekor: " + ex.Message;
            }
        }

        public async Task LoadScreeningsAsync()
        {
            try
            {
                Screenings.Clear();

                var screenings = await _mainWindowModel.GetAllScreenings();
                var movies = await _mainWindowModel.GetAllMovies();

                foreach (var screeningDto in screenings)
                {
                    var movie = movies.FirstOrDefault(m => m.MovieId == screeningDto.MovieId) ?? new MovieDto();

                    var screeningVm = new ScreeningsViewModel(this)
                    {
                        FilmScreeningId = screeningDto.FilmScreeningId,
                        MovieId = screeningDto.MovieId,
                        RoomId = screeningDto.RoomId,
                        Movie = movie,
                        Title = screeningDto.MovieTitle ?? "",
                        Room = screeningDto.RoomName ?? ""
                    };

                    screeningVm.ShowTimes.Clear();
                    screeningVm.ShowTimes.Add(screeningDto.Date);

                    RegisterScreening(screeningVm);
                    Screenings.Add(screeningVm);
                }

                SelectedScreening = Screenings.FirstOrDefault();

                ApplyFilters();
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a vetítések betöltésekor: " + ex.Message;
            }
        }

        private void ToggleMenu()
        {
            IsMenuOpen = !IsMenuOpen;
        }

        private async Task AddNewScreening()
        {
            if (SelectedMovie == null)
            {
                ErrorMessage = "Válassz ki egy filmet a vetítés létrehozásához!";
                return;
            }

            try
            {
                var newScreeningDto = new NewScreeningDto
                {
                    MovieId = SelectedMovie.MovieId,
                    RoomId = Rooms.Any() ? 1 : 0,
                    Date = SelectedDate
                };

                var createdScreening = await _mainWindowModel.NewScreening(newScreeningDto);

                var screeningVm = new ScreeningsViewModel(this)
                {
                    FilmScreeningId = createdScreening.FilmScreeningId,
                    MovieId = createdScreening.MovieId,
                    RoomId = createdScreening.RoomId,
                    Title = createdScreening.MovieTitle,
                    Room = createdScreening.RoomName
                };

                screeningVm.ShowTimes.Add(createdScreening.Date);

                RegisterScreening(screeningVm);
                Screenings.Add(screeningVm);

                SelectedScreening = screeningVm;
                IsEditPanelOpen = true;
                IsMenuOpen = false;
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba az új vetítés létrehozásakor: " + ex.Message;
            }
        }

        private void CloseEditPanel()
        {
            IsEditPanelOpen = false;
            SelectedScreening = null;
            ErrorMessage = "";
            ApplyFilters();
        }

        private void RegisterScreening(ScreeningsViewModel screening)
        {
            screening.ScreeningDeleted += (s, e) => { Screenings.Remove(screening); ApplyFilters(); };
            screening.ScreeningEdit += (s, e) => { SelectedScreening = screening; IsEditPanelOpen = true; };
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
            SelectedScreening = null;
        }

        private void OpenCategoriesPage()
        {
            IsMenuOpen = false;
            //  IsCategoriesPageOpen = true;
        }

        private void CloseCategoryEdit()
        {
            //  IsCategoriesPageOpen = false;
            IsEditPanelOpen = false;
            SelectedCategoryItem = null;
            SelectedScreening = null;
        }

        private void AddPrice()
        {
            var newPrice = new PriceViewModel(this) { Name = "Új ár", Amount = 0 };
            newPrice.PriceDeleted += (s, e) => Prices.Remove(newPrice);
            Prices.Add(newPrice);
            SelectedPriceItem = newPrice;
            IsEditPanelOpen = true;
        }

        private void ApplyFilters()
        {
            FilteredScreenings.Clear();

            foreach (var screening in Screenings)
            {
                bool matchesSearch = string.IsNullOrWhiteSpace(SearchText) || screening.Title.ToLower().Contains(SearchText.ToLower());
                bool matchesRoom = string.IsNullOrEmpty(SelectedRoom) || SelectedRoom == "Mind" || screening.Room == SelectedRoom;
                bool matchesDate = !IsDateFilterActive || screening.ShowTimes.Any(d => d.DateTime.Date == SelectedDate.Date);

                if (matchesSearch && matchesRoom && matchesDate)
                    FilteredScreenings.Add(screening);
            }
        }

        private void AddDateToSelectedMovie()
        {
            if (SelectedScreening != null)
            {
                SelectedScreening.ShowTimes.Add(SelectedDate);
            }
        }

        private void DeleteDateSelectedMovie(DateTimeOffset date)
        {
            if (SelectedScreening != null)
            {
                SelectedScreening.ShowTimes.Remove(date);
            }
        }
    }
}
