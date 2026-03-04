using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using CinemaProject_Avalonia.Models;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.AspNetCore.Http;
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

        public ObservableCollection<MovieDto> Movies { get; set; } = new();
        public ObservableCollection<ScreeningsViewModel> Screenings { get; set; } = new();
        public ObservableCollection<ScreeningsViewModel> FilteredScreenings { get; set; } = new();
        public ObservableCollection<TicketViewModel> Prices { get; set; } = new();
        public ObservableCollection<UserViewModel> Users { get; set; } = new();
        public ObservableCollection<RoomViewModel> Room { get; set; } = new();
        public ObservableCollection<ReservationViewModel> Reservations { get; set; } = new();

        public ObservableCollection<string> Rooms { get; set; } = new();


        private ScreeningsViewModel? _selectedScreening;
        private MovieDto? _selectedMovie;
        private UserViewModel? _selectedUserItem { get; set; }
        private TicketViewModel? _selectedPriceItem { get; set; }
        private RoomViewModel? _selectedRoomItem { get; set; }
        private ReservationViewModel? _selectedReservationItem { get; set; }

        private string _selectedRoom;
        private DateTimeOffset _selectedDate = DateTime.Today;
        private string _searchText = "";
        private string _errorMessage;


        private bool _isMenuOpen;
        private bool _isEditPanelOpen;
        private bool _isTicketsPageOpen;
        private bool _isUsersPageOpen;
        private bool _isRoomPageOpen;
        private bool _isReservationPageOpen;
        private bool _isDateFilterActive = false;


        public RelayCommand ToggleMenuCommand { get; set; }
        public RelayCommand BlockPointerCommand { get; set; }

        public RelayCommand AddNewMovieCommand {  get; set; }
        public RelayCommand AddNewScreeningCommand { get; set; }
        public RelayCommand AddPriceCommand { get; set; }
        public RelayCommand AddDateToSelectedMovieCommand { get; set; }

        public RelayCommand OpenTicketsPageCommand { get; set; }
        public RelayCommand OpenUsersPageCommand { get; set; }
        public RelayCommand OpenRoomPageCommand { get; set; }
        public RelayCommand OpenReservationCommand { get; set; }

        public RelayCommand CloseEditPanelCommand { get; set; }
        public RelayCommand CloseTicketPageCommand { get; set; }
        public RelayCommand CloseUsersPageCommand { get; set; }
        public RelayCommand CloseRoomPageCommand { get; set; }
        public RelayCommand CloseReservationPageCommand { get; set; }

        public RelayCommand<DateTimeOffset> DeleteDateSelectedMovieCommand { get; set; }

        public RelayCommand ClearFiltersCommand { get; set; }

        public AsyncRelayCommand Logout { get; set; }


        public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

        public EventHandler ExitToNavigationRequest;

        private bool _isAdmin;
        public bool IsAdmin
        {
            get => _mainWindowModel._session.IsAdmin;
            set
            {
                _isAdmin = value;
                OnPropertyChanged();
            }
        }

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
        public bool IsTicketsPageOpen
        {
            get => _isTicketsPageOpen;
            set
            {
                _isTicketsPageOpen = value;
                OnPropertyChanged();
            }
        }
        public bool IsUsersPageOpen
        {
            get => _isUsersPageOpen;
            set
            {
                _isUsersPageOpen = value;
                OnPropertyChanged();
            }
        }

        public bool IsRoomPageOpen
        {
            get => _isRoomPageOpen;
            set
            {
                _isRoomPageOpen = value;
                OnPropertyChanged();
            }
        }

        public bool IsReservationPageOpen
        {
            get => _isReservationPageOpen;
            set
            {
                _isReservationPageOpen = value;
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
        public TicketViewModel? SelectedPriceItem
        {
            get => _selectedPriceItem;
            set
            {
                _selectedPriceItem = value;
                OnPropertyChanged();
            }
        }
        public UserViewModel? SelectedUserItem
        {
            get => _selectedUserItem;
            set
            {
                _selectedUserItem = value;
                OnPropertyChanged();
            }
        }

        public RoomViewModel? SelectedRoomItem
        {
            get => _selectedRoomItem;
            set
            {
                _selectedRoomItem = value;
                OnPropertyChanged();
            }
        }

        public ReservationViewModel? SelectedReservationItem
        {
            get => _selectedReservationItem;
            set
            {
                _selectedReservationItem = value;
                OnPropertyChanged();
            }
        }

        public MainWindowViewModel(MainWindowModel model)
        {
            _mainWindowModel = model;

            Prices = new ObservableCollection<TicketViewModel>();
            Users = new ObservableCollection<UserViewModel>();
            Room = new ObservableCollection<RoomViewModel>();
            Reservations = new ObservableCollection<ReservationViewModel>();


            Rooms = new ObservableCollection<string>();

            SelectedScreening = new ScreeningsViewModel(this)
            {
                ShowTimes = new ObservableCollection<DateTimeOffset>()
            };

            ToggleMenuCommand = new RelayCommand(ToggleMenu);
            BlockPointerCommand = new RelayCommand(() => { });

            AddNewMovieCommand = new RelayCommand(AddNewMovie);
            AddNewScreeningCommand = new RelayCommand(AddNewScreening);
            AddDateToSelectedMovieCommand = new RelayCommand(AddDateToSelectedMovie);
            AddPriceCommand = new RelayCommand(AddPrice);

            OpenTicketsPageCommand = new RelayCommand(OpenTicketPage);
            OpenUsersPageCommand = new RelayCommand(OpenUserPage);
            OpenRoomPageCommand = new RelayCommand(OpenRoomPage);
            OpenReservationCommand = new RelayCommand(OpenReservationPage);

            CloseEditPanelCommand = new RelayCommand(CloseEditPanel);
            CloseTicketPageCommand = new RelayCommand(CloseTicketPage);
            CloseUsersPageCommand = new RelayCommand(CloseUserPage);
            CloseRoomPageCommand = new RelayCommand(CloseRoomPage);
            CloseReservationPageCommand = new RelayCommand(CloseReservationPage);

            DeleteDateSelectedMovieCommand = new RelayCommand<DateTimeOffset>(DeleteDateSelectedMovie);

            ClearFiltersCommand = new RelayCommand(ClearFilters);

            Logout = new AsyncRelayCommand(LogOut);

        }
        public async Task InitializeAfterLoginAsync()
        {
            await LoadAllDataAsync();
        }
        public async Task LoadAllDataAsync()
        {
            await LoadRoomsAsync();
            await LoadTicketsAsync();
            await LoadMoviesForScreeningsAsync();
            await LoadScreeningsAsync();

            if (IsAdmin)
            {
                await LoadUsersAsync();
                await LoadReservationAsync();
            }
        }

        private async Task LoadRoomsAsync()
        {
            try
            {
                Room.Clear();

                var termek = await _mainWindowModel.GetAllRooms();

                foreach (var terem in termek)
                {
                    Room.Add(new RoomViewModel(this)
                    {
                        Name = terem.RoomName
                    });
                    Rooms.Add(terem.RoomName);
                }
                IsAdmin = true;
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a termek betöltésekor: " + ex.Message;
            }
        }

        private async Task LoadTicketsAsync()
        {
            try
            {
                Prices.Clear();

                var tickets = await _mainWindowModel.GetAllTickets();

                foreach (var ticket in tickets)
                {
                    Prices.Add(new TicketViewModel(this)
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

        private async Task LoadUsersAsync()
        {
            if (!IsAdmin)
                return;

            try
            {
                Users.Clear();

                var felhasz = await _mainWindowModel.GetAllUsers();
                foreach (var ember in felhasz)
                {
                    Users.Add(new UserViewModel(this)
                    {
                        Email = ember.Email,
                        Name = ember.FullName,
                        //Role = ember.Role
                    });
                }
                Console.WriteLine($"Users: {Users.Count}");
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a felhasználók betöltésekor: " + ex.Message;
            }
        }

        private async Task LoadReservationAsync()
        {
            if (!IsAdmin)
                return;

            try
            {
                Reservations.Clear();

                var foglalasok = await _mainWindowModel.GetAllReservations();
                foreach (var foglalas in foglalasok)
                {
                    Reservations.Add(new ReservationViewModel(this)
                    {
                        Date = foglalas.Date,
                        IsPaid = foglalas.IsPaid,
                        ScreeningId = foglalas.FilmScreeningId,
                        Amount = foglalas.Amount,
                        Price = foglalas.Price,
                        UserId = foglalas.UserId,
                    });
                }
                Console.WriteLine($"Reser: {Reservations.Count}");
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a foglalások betöltésekor: " + ex.Message;
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
                var rooms = await _mainWindowModel.GetAllRooms();

                foreach (var screeningDto in screenings)
                {
                    var movie = movies.FirstOrDefault(m => m.MovieId == screeningDto.MovieId);
                    var room = rooms.FirstOrDefault(r => r.RoomId == screeningDto.RoomId);

                    if (movie == null || room == null)
                        continue;

                    var screeningVm = new ScreeningsViewModel(this)
                    {
                        FilmScreeningId = screeningDto.FilmScreeningId,
                        MovieId = screeningDto.MovieId,
                        RoomId = screeningDto.RoomId,
                        Title = movie.MovieTitle,
                        Room = room.RoomName
                    };

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

        private void AddNewScreening()
        {
            try
            {
                var screeningVm = new ScreeningsViewModel(this)
                {
                    FilmScreeningId = 0,
                    MovieId = 0,
                    RoomId = 0,
                    Title = "",
                    Room = ""
                };

                screeningVm.ShowTimes = new ObservableCollection<DateTimeOffset>();

                RegisterScreening(screeningVm);

                Screenings.Add(screeningVm);

                SelectedScreening = screeningVm;
                IsEditPanelOpen = true;
                IsMenuOpen = false;
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba az új üres vetítés létrehozásakor: " + ex.Message;
            }
        }

        private void AddNewMovie()
        {

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

        private void OpenTicketPage()
        {
            IsMenuOpen = false;
            IsTicketsPageOpen = true;
        }

        private void CloseTicketPage()
        {
            IsTicketsPageOpen = false;
            IsEditPanelOpen = false;
            SelectedPriceItem = null;
            SelectedScreening = null;
        }

        private void OpenUserPage()
        {
            IsMenuOpen = false;
            IsUsersPageOpen = true;
        }

        private void CloseUserPage()
        {
            IsUsersPageOpen = false;
            IsEditPanelOpen = false;
            SelectedUserItem = null;
            SelectedScreening = null;
        }

        private void OpenRoomPage()
        {
            IsMenuOpen = false;
            IsRoomPageOpen = true;
        }

        private void CloseRoomPage()
        {
            IsRoomPageOpen = false;
            IsEditPanelOpen = false;
            SelectedRoomItem = null;
            SelectedScreening = null;
        }

        private void OpenReservationPage()
        {
            IsMenuOpen = false;
            IsReservationPageOpen = true;
        }

        private void CloseReservationPage()
        {
            IsReservationPageOpen = false;
            IsEditPanelOpen = false;
            SelectedReservationItem = null;
            SelectedScreening = null;
        }

        private void AddPrice()
        {
            var newPrice = new TicketViewModel(this) { Name = "Új ár", Amount = 0 };
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
                bool matchesDate = !IsDateFilterActive || screening.ShowTimes.Any(d => d.DateTime.Date == SelectedDate.Date);
                bool matchesSearch = string.IsNullOrWhiteSpace(SearchText) || screening.Title.ToLower().Contains(SearchText.ToLower());
                bool matchesRoom = string.IsNullOrEmpty(SelectedRoom) || screening.Room == SelectedRoom;
                bool matchesMovie = SelectedMovie == null || screening.MovieId == SelectedMovie.MovieId;

                if (matchesSearch && matchesRoom && matchesDate && matchesMovie)
                    FilteredScreenings.Add(screening);
            }
        }

        private void ClearFilters() 
        {
            SelectedMovie = null;
            SelectedRoom = "";
            SelectedDate = DateTime.Today;
            SearchText = "";
            ApplyFilters();
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

        private async Task LogOut()
        {
            try
            {
                var res = await _mainWindowModel._session.Client.PostAsync("api/user/logout", null);

                res.EnsureSuccessStatusCode();
                _mainWindowModel._session.Userid = 0;
                _mainWindowModel._session.Username = "";
                _mainWindowModel._session.Role = "";

                ExitToNavigationRequest?.Invoke(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba kijelentkezéskor: " + ex.Message;
            }
        }
    }
}
