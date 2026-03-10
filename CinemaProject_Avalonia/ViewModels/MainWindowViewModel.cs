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
using System.Net.Sockets;
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
        public ObservableCollection<ReservationViewModel> Reservations { get; set; }

        public ObservableCollection<string> Rooms { get; set; } = new();

        private ScreeningsViewModel? _selectedScreening;
        private MovieDto? _selectedMovie;
        private UserViewModel? _selectedUserItem { get; set; }
        private TicketViewModel? _selectedPriceItem { get; set; }
        private RoomViewModel? _selectedRoomItem { get; set; }
        private ReservationViewModel? _selectedReservationItem { get; set; }
        private MovieViewModel? _selectedMovieEdit { get; set; }

        private string _selectedRoom;
        private DateTimeOffset _selectedDate = DateTime.Today;
        private string _searchText = "";
        private string _errorMessage;


        private bool _isMenuOpen;
        private bool _isScreeningEditPanelOpen;
        private bool _isMovieEditPanelOpen;
        private bool _isTicketsPageOpen;
        private bool _isUsersPageOpen;
        private bool _isRoomPageOpen;
        private bool _isReservationPageOpen;
        private bool _isReservationEditPanelOpen;
        private bool _isDateFilterActive = false;


        public RelayCommand ToggleMenuCommand { get; set; }
        public RelayCommand BlockPointerCommand { get; set; }

        public RelayCommand AddNewMovieCommand { get; set; }
        public AsyncRelayCommand AddNewScreeningCommand { get; set; }
        public RelayCommand AddPriceCommand { get; set; }
        public RelayCommand AddDateToSelectedMovieCommand { get; set; }

        public RelayCommand OpenTicketsPageCommand { get; set; }
        public RelayCommand OpenUsersPageCommand { get; set; }
        public RelayCommand OpenRoomPageCommand { get; set; }
        public RelayCommand OpenReservationCommand { get; set; }

        public RelayCommand CloseEditPanelCommand { get; set; }
        public RelayCommand CloseMovieEditPanelCommand { get; set; }
        public RelayCommand CloseTicketPageCommand { get; set; }
        public RelayCommand CloseUsersPageCommand { get; set; }
        public RelayCommand CloseRoomPageCommand { get; set; }
        public RelayCommand CloseReservationPageCommand { get; set; }

        public RelayCommand CloseReservationPanelCommand { get; }

        public RelayCommand<DateTimeOffset> DeleteDateSelectedMovieCommand { get; set; }

        public RelayCommand ClearFiltersCommand { get; set; }

        public AsyncRelayCommand Logout { get; set; }


        public bool HasError => !string.IsNullOrEmpty(ErrorMessage);

        public event EventHandler? ExitToNavigationRequest;

        private int _currentAdminId;
        private bool _isAdmin;
        public bool IsAdmin
        {
            get => _mainWindowModel._session.IsAdmin;
            set
            {
                _mainWindowModel._session.IsAdmin = value;
                OnPropertyChanged();
            }
        }

        public int CurrentAdminId
        {
            get => _currentAdminId;
            set
            {
                _currentAdminId = value;
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
        public bool IsScreeningEditPanelOpen
        {
            get => _isScreeningEditPanelOpen;
            set
            {
                _isScreeningEditPanelOpen = value;
                OnPropertyChanged();
            }
        }

        public bool IsMovieEditPanelOpen
        {
            get => _isMovieEditPanelOpen;
            set
            {
                _isMovieEditPanelOpen = value;
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

        public bool IsReservationEditPanelOpen
        {
            get => _isReservationEditPanelOpen;
            set
            {
                _isReservationEditPanelOpen = value;
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

        public MovieViewModel? SelectedMovieEdit
        {
            get => _selectedMovieEdit;
            set
            {
                _selectedMovieEdit = value;
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
            AddNewScreeningCommand = new AsyncRelayCommand(AddNewScreening);
            AddDateToSelectedMovieCommand = new RelayCommand(AddDateToSelectedMovie);

            OpenTicketsPageCommand = new RelayCommand(OpenTicketPage);
            OpenUsersPageCommand = new RelayCommand(OpenUserPage);
            OpenRoomPageCommand = new RelayCommand(OpenRoomPage);
            OpenReservationCommand = new RelayCommand(OpenReservationPage);

            CloseEditPanelCommand = new RelayCommand(CloseEditPanel);
            CloseMovieEditPanelCommand = new RelayCommand(CloseMovieEditPanel);
            CloseTicketPageCommand = new RelayCommand(CloseTicketPage);
            CloseUsersPageCommand = new RelayCommand(CloseUserPage);
            CloseRoomPageCommand = new RelayCommand(CloseRoomPage);
            CloseReservationPageCommand = new RelayCommand(CloseReservationPage);

            CloseReservationPanelCommand = new RelayCommand(CloseReservationPanel);

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
            await LoadMoviesAsync();
            await LoadScreeningsAsync();

            if (IsAdmin)
            {
                await LoadUsersAsync();
                await LoadReservationAsync();
            }
        }

        // ===================== MOVIES =====================

        public async Task LoadMoviesAsync()
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

        private void AddNewMovie()
        {
            try
            {
                SelectedMovieEdit = new MovieViewModel(_mainWindowModel);

                SelectedMovieEdit.MovieSaved += async (s, e) =>
                {
                    await LoadMoviesAsync();
                    SelectedMovieEdit = null;
                    IsMovieEditPanelOpen = false;
                };

                IsMovieEditPanelOpen = true;
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba az új film szerkesztő megnyitásakor: " + ex.Message;
            }
        }
        public async Task UpdateMovieAsync(ModifyMovieDto movie)
        {
            try
            {
                await _mainWindowModel.ModifyMovie(movie, movie.MovieId);
                await LoadMoviesAsync();
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba film módosításakor: " + ex.Message;
            }
        }

        public async Task DeleteMovieAsync(int movieId)
        {
            try
            {
                await _mainWindowModel.DeleteMovie(movieId);
                await LoadMoviesAsync();
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba film törlésekor: " + ex.Message;
            }
        }

        // ===================== SCREENINGS =====================

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

        private async Task AddNewScreening()
        {
            try
            {
                if (SelectedMovie == null || string.IsNullOrEmpty(SelectedRoom))
                {
                    ErrorMessage = "Válassz filmet és termet!";
                    return;
                }

                var room = Room.FirstOrDefault(r => r.Name == SelectedRoom);

                if (room == null)
                {
                    ErrorMessage = "A terem nem található!";
                    return;
                }

                var newScreening = new NewScreeningDto
                {
                    MovieId = SelectedMovie.MovieId,
                    MovieTitle = SelectedMovie.MovieTitle,
                    RoomId = room.RoomId,
                    RoomName = SelectedRoom,
                    Date = SelectedDate
                };

                await _mainWindowModel.NewScreening(newScreening);

                await LoadScreeningsAsync();
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a vetítés létrehozásakor: " + ex.Message;
            }
        }

        public async Task UpdateScreeningAsync(ModifyFilmScreeningDto screening)
        {
            try
            {
                await _mainWindowModel.ModifyFilmScreening(screening, screening.FilmScreeningId);
                await LoadMoviesAsync();
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba vetítés módosításakor: " + ex.Message;
            }
        }

        public async Task DeleteScreeningAsync(int screeningId)
        {
            try
            {
                await _mainWindowModel.DeleteScreening(screeningId);
                await LoadMoviesAsync();
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba vetítés törlésekor: " + ex.Message;
            }
        }

        private void RegisterScreening(ScreeningsViewModel screening)
        {
            screening.ScreeningDeleted += (s, e) => { Screenings.Remove(screening); ApplyFilters(); };
            screening.ScreeningEdit += (s, e) => { SelectedScreening = screening; IsScreeningEditPanelOpen = true; };
        }

        // ===================== TICKETS =====================

        private async Task LoadTicketsAsync()
        {
            try
            {
                Prices.Clear();

                var tickets = await _mainWindowModel.GetAllTicketT();

                foreach (var ticket in tickets)
                {
                    Prices.Add(new TicketViewModel(this, _mainWindowModel)
                    {
                        Id = ticket.Id,
                        Name = ticket.TicketName,
                        Price = ticket.Price,
                    });
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a jegyárak betöltésekor: " + ex.Message;
            }
        }

        public async Task UpdateTicketAsync(TicketViewModel ticket)
        {
            SelectedPriceItem = ticket;

            SelectedPriceItem.PriceSaved += async (s, dto) =>
            {
                try
                {
                    await _mainWindowModel.ModifyTicketType(dto, dto.Id);

                    await LoadTicketsAsync();
                    SelectedPriceItem = null;
                    ErrorMessage = "";
                }
                catch (Exception ex)
                {
                    ErrorMessage = "Hiba a jegy mentésekor: " + ex.Message;
                }
            };
        }

        public async Task DeleteTicketTypeAsync(int ticketTId)
        {
            try
            {
                await _mainWindowModel.DeleteTicketType(ticketTId);
                await LoadRoomsAsync();
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba jegy törlésekor: " + ex.Message;
            }
        }

        // ==================== ROOMS ====================

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

        public async Task AddNewRoomAsync(NewRoomDto newRoom)
        {
            try
            {
                await _mainWindowModel.NewRoom(newRoom);
                await LoadRoomsAsync();
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba új terem hozzáadásakor: " + ex.Message;
            }
        }

        public async Task UpdateRoomAsync(ModifyRoomDto room)
        {
            try
            {
                await _mainWindowModel.ModifyRoom(room, room.RoomId);
                await LoadRoomsAsync();
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba terem módosításakor: " + ex.Message;
            }
        }

        public async Task DeleteRoomAsync(int roomId)
        {
            try
            {
                await _mainWindowModel.DeleteRoom(roomId);
                await LoadRoomsAsync();
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba terem törlésekor: " + ex.Message;
            }
        }

        // ===================== USERS =====================

        private async Task LoadUsersAsync()
        {
            try
            {
                Users.Clear();

                var felhasz = await _mainWindowModel.GetAllUsers();
                foreach (var ember in felhasz)
                {
                    var vm = new UserViewModel(this, _mainWindowModel)
                    {
                        UserId = ember.UserId,
                        Email = ember.Email,
                        Name = ember.FullName,
                        Role = ember.Role
                    };

                    vm.UserDeleted += async (s, e) => await DeleteUserAsync(vm.UserId);

                    Users.Add(vm);
                }

            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a felhasználók betöltésekor: " + ex.Message;
            }
        }

        public async Task DeleteUserAsync(int userId)
        {
            try
            {
                await _mainWindowModel.DeleteUser(userId);
                await LoadUsersAsync();
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba felhasználó törlésekor: " + ex.Message;
            }
        }

        public async Task ChangeUserRoleAsync(UserViewModel user)
        {
            try
            {
                await _mainWindowModel.ChangeRole(user.UserId, user.Role, CurrentAdminId);

                await LoadUsersAsync();
                SelectedUserItem = null;
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba szerepkör módosításakor: " + ex.Message;
            }
        }

        // ===================== RESERVATIONS =====================

        private async Task LoadReservationAsync()
        {

            try
            {
                Reservations.Clear();

                var foglalasok = await _mainWindowModel.GetAllReservations();
                foreach (var foglalas in foglalasok)
                {
                    var reservationVM = new ReservationViewModel(this, _mainWindowModel)
                    {
                        ReservationId = foglalas.PaymentReservationId,
                        Date = foglalas.Date,
                        IsPaid = foglalas.IsPaid,
                        ScreeningId = foglalas.FilmScreeningId,
                        Amount = foglalas.Amount,
                        Price = foglalas.Price,
                        UserId = foglalas.UserId,
                        Seats = foglalas.Seats,
                    };

                    reservationVM.ReservationDeleted += async (s, e) =>
                    {
                        await DeleteReservationAsync(reservationVM.ReservationId);
                    };

                    reservationVM.ReservationSaved += async (s, e) =>
                    {
                        await LoadReservationAsync();
                    };

                    Reservations.Add(reservationVM);
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a foglalások betöltésekor: " + ex.Message;
            }
        }

        public async Task UpdateReservationAsync(ReservationViewModel reservation)
        {
            try
            {
                SelectedReservationItem = reservation;

                SelectedReservationItem.ReservationSaved -= OnReservationSaved;

                SelectedReservationItem.ReservationSaved += OnReservationSaved;

                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a foglalás módosításakor: " + ex.Message;
            }
        }

        public async Task DeleteReservationAsync(int reservationId)
        {
            try
            {
                await _mainWindowModel.DeleteReservation(reservationId);
                await LoadReservationAsync();
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba foglalás törlésekor: " + ex.Message;
            }
        }

        private async void OnReservationSaved(object? sender, EventArgs e)
        {
            await LoadReservationAsync();
            SelectedReservationItem = null;
        }

        // ===================== IMAGE =====================

        public async Task UploadImageAsync(ImageDto image)
        {
            try
            {
                await _mainWindowModel.UploadImage(image);
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba kép feltöltésekor: " + ex.Message;
            }
        }

        public async Task DeleteImageAsync(int imageId)
        {
            try
            {
                await _mainWindowModel.DeleteImage(imageId);
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba kép törlésekor: " + ex.Message;
            }
        }

        public async Task<ImageDto> GetImageAsync(int movieId)
        {
            try
            {
                var image = await _mainWindowModel.GetImage(movieId);
                ErrorMessage = "";
                return image;
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba kép betöltésekor: " + ex.Message;
                return null!;
            }
        }

        // ===================== DATE =====================

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

        // ===================== MENU & EDIT PANELS =====================

        private void ToggleMenu()
        {
            IsMenuOpen = !IsMenuOpen;
        }

        private void CloseEditPanel()
        {
            IsScreeningEditPanelOpen = false;
            SelectedScreening = null;
            ErrorMessage = "";
            ApplyFilters();
        }

        private void CloseMovieEditPanel()
        {
            IsMovieEditPanelOpen = false;
            ErrorMessage = "";
            ApplyFilters();
        }

        private void OpenTicketPage()
        {
            IsMenuOpen = false;
            IsTicketsPageOpen = true;
        }

        private void CloseTicketPage()
        {
            IsTicketsPageOpen = false;
            IsScreeningEditPanelOpen = false;
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
            IsScreeningEditPanelOpen = false;
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
            IsScreeningEditPanelOpen = false;
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
            IsScreeningEditPanelOpen = false;
            SelectedReservationItem = null;
            SelectedScreening = null;
        }

        private void CloseReservationPanel()
        {
            IsReservationEditPanelOpen = false;
            SelectedReservationItem = null;
        }

        // ===================== FILTERS =====================
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

        // ===================== LOGOUT =====================

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
