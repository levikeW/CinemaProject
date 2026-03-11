using Avalonia.Media.Imaging;
using Avalonia.Platform.Storage;
using Avalonia.Controls;
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
using System.IO;
using System.Linq;
using System.Net.Sockets;
using System.Threading.Tasks;

namespace CinemaProject_Avalonia.ViewModels
{
    public partial class MainWindowViewModel : ViewModelBase
    {

        private readonly MainWindowModel _mainWindowModel;

        private Window? _hostWindow;

        public ObservableCollection<MovieViewModel> Movies { get; set; }
        public ObservableCollection<ScreeningsViewModel> Screenings { get; set; }
        public ObservableCollection<ScreeningsViewModel> FilteredScreenings { get; set; }
        public ObservableCollection<TicketViewModel> Prices { get; set; }
        public ObservableCollection<UserViewModel> Users { get; set; }
        public ObservableCollection<RoomViewModel> Room { get; set; }
        public ObservableCollection<ReservationViewModel> Reservations { get; set; }
        public ObservableCollection<CategoryViewModel> Categories { get; set; }

        public ObservableCollection<string> Rooms { get; set; } = new();

        private ScreeningsViewModel? _selectedScreening;
        private MovieViewModel? _selectedMovie;

        private MovieViewModel? _selectedMovieItem { get; set; }
        private UserViewModel? _selectedUserItem { get; set; }
        private TicketViewModel? _selectedPriceItem { get; set; }
        private RoomViewModel? _selectedRoomItem { get; set; }
        private ReservationViewModel? _selectedReservationItem { get; set; }
        private CategoryViewModel? _selectedCategoryItem { get; set; }


        private string _selectedRoom;
        private DateTimeOffset _selectedDate = DateTime.Today;
        private string _searchText = "";
        private string _errorMessage;


        private bool _isMenuOpen;

        private bool _isMoviePageOpen;
        private bool _isMovieEditPanelOpen;
        private bool _isMovieAddPanelOpen;

        private bool _isScreeningEditPanelOpen;

        private bool _isTicketAddPanelOpen;
        private bool _isTicketEditPanelOpen;
        private bool _isTicketsPageOpen;

        private bool _isUsersPageOpen;

        private bool _isRoomAddPanelOpen;
        private bool _isRoomEditPanelOpen;
        private bool _isRoomPageOpen;

        private bool _isReservationPageOpen;
        private bool _isReservationEditPanelOpen;

        private bool _isCategoryPageOpen;
        private bool _isCategoryAddPanelOpen;
        private bool _isCategoryEditPanelOpen;

        private bool _isDateFilterActive = false;


        public RelayCommand ToggleMenuCommand { get; set; }
        public RelayCommand BlockPointerCommand { get; set; }

        public RelayCommand AddNewMovieCommand { get; set; }
        public AsyncRelayCommand AddNewScreeningCommand { get; set; }
        public RelayCommand AddPriceCommand { get; set; }
        public RelayCommand AddDateToSelectedMovieCommand { get; set; }

        public RelayCommand OpenMoviePageCommand { get; set; }
        public RelayCommand OpenMovieAddPanelCommand { get; set; }

        public RelayCommand OpenTicketAddPanelCommand { get; set; }
        public RelayCommand OpenTicketsPageCommand { get; set; }

        public RelayCommand OpenUsersPageCommand { get; set; }

        public RelayCommand OpenRoomAddPanelCommand { get; set; }
        public RelayCommand OpenRoomPageCommand { get; set; }

        public RelayCommand OpenReservationCommand { get; set; }

        public RelayCommand OpenCategoryPageCommand { get; set; }
        public RelayCommand OpenCategoryAddPanelCommand { get; set; }


        public RelayCommand CloseEditPanelCommand { get; set; }

        public RelayCommand CloseMoviePageCommand { get; set; }
        public RelayCommand CloseMovieEditPanelCommand { get; set; }
        public RelayCommand CloseMovieAddPanelCommand { get; set; }

        public RelayCommand CloseTicketAddPanelCommand { get; set; }
        public RelayCommand CloseTicketEditPanelCommand { get; set; }
        public RelayCommand CloseTicketPageCommand { get; set; }

        public RelayCommand CloseUsersPageCommand { get; set; }

        public RelayCommand CloseRoomAddPanelCommand { get; set; }
        public RelayCommand CloseRoomEditPanelCommand { get; set; }
        public RelayCommand CloseRoomPageCommand { get; set; }

        public RelayCommand CloseReservationPageCommand { get; set; }
        public RelayCommand CloseReservationPanelCommand { get; }

        public RelayCommand CloseCategoryPageCommand { get; set; }
        public RelayCommand CloseCategoryAddPanelCommand { get; set; }
        public RelayCommand CloseCategoryEditPanelCommand { get; set; }

        public AsyncRelayCommand UploadMovieImageCommand { get; set; }
        public AsyncRelayCommand LoadMovieImageCommand { get; set; }
        public AsyncRelayCommand DeleteMovieImageCommand { get; set; }


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
            get => _selectedScreening;
            set
            {
                _selectedScreening = value;
                OnPropertyChanged(nameof(SelectedScreening));
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
        public bool IsMoviePageOpen
        {
            get => _isMoviePageOpen;
            set
            {
                _isMoviePageOpen = value;
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
        public bool IsMovieAddPanelOpen
        {
            get => _isMovieAddPanelOpen;
            set
            {
                _isMovieAddPanelOpen = value;
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

        public bool IsTicketAddPanelOpen
        {
            get => _isTicketAddPanelOpen;
            set
            {
                _isTicketAddPanelOpen = value;
                OnPropertyChanged();
            }
        }

        public bool IsTicketEditPanelOpen
        {
            get => _isTicketEditPanelOpen;
            set
            {
                _isTicketEditPanelOpen = value;
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

        public bool IsRoomAddPanelOpen
        {
            get => _isRoomAddPanelOpen;
            set
            {
                _isRoomAddPanelOpen = value;
                OnPropertyChanged();
            }
        }

        public bool IsRoomEditPanelOpen
        {
            get => _isRoomEditPanelOpen;
            set
            {
                _isRoomEditPanelOpen = value;
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
        public bool IsCategoryPageOpen
        {
            get => _isCategoryPageOpen;
            set
            {
                _isCategoryPageOpen = value;
                OnPropertyChanged();
            }
        }

        public bool IsCategoryAddPanelOpen
        {
            get => _isCategoryAddPanelOpen;
            set
            {
                _isCategoryAddPanelOpen = value;
                OnPropertyChanged();
            }
        }

        public bool IsCategoryEditPanelOpen
        {
            get => _isCategoryEditPanelOpen;
            set
            {
                _isCategoryEditPanelOpen = value;
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

        public MovieViewModel? SelectedMovieItem
        {
            get => _selectedMovieItem;
            set
            {
                _selectedMovieItem = value;
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

            Movies = new ObservableCollection<MovieViewModel>();
            Screenings = new ObservableCollection<ScreeningsViewModel>();
            FilteredScreenings = new ObservableCollection<ScreeningsViewModel>();

            Prices = new ObservableCollection<TicketViewModel>();
            Users = new ObservableCollection<UserViewModel>();
            Room = new ObservableCollection<RoomViewModel>();
            Reservations = new ObservableCollection<ReservationViewModel>();
            Categories = new ObservableCollection<CategoryViewModel>();


            Rooms = new ObservableCollection<string>();

            SelectedScreening = new ScreeningsViewModel(this)
            {
                ShowTimes = new ObservableCollection<DateTimeOffset>()
            };

            ToggleMenuCommand = new RelayCommand(ToggleMenu);
            BlockPointerCommand = new RelayCommand(() => { });

            AddNewScreeningCommand = new AsyncRelayCommand(AddNewScreening);
            AddDateToSelectedMovieCommand = new RelayCommand(AddDateToSelectedMovie);

            OpenMoviePageCommand = new RelayCommand(OpenMoviePage);
            OpenMovieAddPanelCommand = new RelayCommand(OpenMovieAddPanel);

            OpenTicketAddPanelCommand = new RelayCommand(OpenTicketAddPanel);
            OpenTicketsPageCommand = new RelayCommand(OpenTicketPage);

            OpenUsersPageCommand = new RelayCommand(OpenUserPage);

            OpenRoomAddPanelCommand = new RelayCommand(OpenRoomAddPanel);
            OpenRoomPageCommand = new RelayCommand(OpenRoomPage);

            OpenReservationCommand = new RelayCommand(OpenReservationPage);

            OpenCategoryPageCommand = new RelayCommand(OpenCategoryPage);
            OpenCategoryAddPanelCommand = new RelayCommand(OpenCategoryAddPanel);


            CloseEditPanelCommand = new RelayCommand(CloseEditPanel);

            CloseMoviePageCommand = new RelayCommand(CloseMoviePage);
            CloseMovieAddPanelCommand = new RelayCommand(CloseMovieAddPanel);
            CloseMovieEditPanelCommand = new RelayCommand(CloseMovieEditPanel);

            CloseTicketAddPanelCommand = new RelayCommand(CloseTicketAddPanel);
            CloseTicketEditPanelCommand = new RelayCommand(CloseTicketEditPanel);
            CloseTicketPageCommand = new RelayCommand(CloseTicketPage);

            CloseUsersPageCommand = new RelayCommand(CloseUserPage);

            CloseRoomAddPanelCommand = new RelayCommand(CloseRoomAddPanel);
            CloseRoomEditPanelCommand = new RelayCommand(CloseRoomEditPanel);
            CloseRoomPageCommand = new RelayCommand(CloseRoomPage);

            CloseReservationPageCommand = new RelayCommand(CloseReservationPage);
            CloseReservationPanelCommand = new RelayCommand(CloseReservationPanel);

            CloseCategoryPageCommand = new RelayCommand(CloseCategoryPage);
            CloseCategoryAddPanelCommand = new RelayCommand(CloseCategoryAddPanel);
            CloseCategoryEditPanelCommand = new RelayCommand(CloseCategoryEditPanel);

            UploadMovieImageCommand = new AsyncRelayCommand(UploadMovieImageAsync);
            LoadMovieImageCommand = new AsyncRelayCommand(LoadMovieImageAsync);
            DeleteMovieImageCommand = new AsyncRelayCommand(DeleteMovieImageAsync);


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
            await LoadCategoriesAsync();
            await LoadMoviesAsync();
            await LoadScreeningsAsync();

            if (IsAdmin)
            {
                await LoadUsersAsync();
                await LoadReservationAsync();
            }
        }

        public void SetHostWindow(Window window)
        {
            _hostWindow = window;
        }

        // ===================== MOVIES =====================

        public async Task LoadMoviesAsync()
        {
            try
            {
                Movies.Clear();

                var movies = await _mainWindowModel.GetAllMovies();

                foreach (var movie in movies)
                {
                    var movieVM = new MovieViewModel(this)
                    {
                        MovieId = movie.MovieId,
                        MovieTitle = movie.MovieTitle,
                        Duration = movie.Duration,
                        Genre = movie.Genre,
                        Director = movie.Director,
                        Description = movie.Description,
                        ImageId = movie.ImageId,
                        Status = movie.Status
                    };

                    if (movie.ImageId != 0)
                    {
                        try
                        {
                            var imageDto = await _mainWindowModel.GetImage(movie.MovieId);

                            if (imageDto != null && imageDto.ImageContent != null && imageDto.ImageContent.Length > 0)
                            {
                                using var ms = new MemoryStream(imageDto.ImageContent);
                                movieVM.MovieImage = new Bitmap(ms);
                            }
                        }
                        catch
                        {
                            movieVM.MovieImage = null;
                        }
                    }

                    movieVM.MovieEditSaved += async (s, dto) =>
                    {
                        try
                        {
                            await _mainWindowModel.ModifyMovie(dto, dto.MovieId);
                            await LoadMoviesAsync();
                            SelectedMovieItem = null;
                            IsMovieEditPanelOpen = false;
                            IsMovieAddPanelOpen = false;
                            ErrorMessage = "";
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba film módosításakor: " + ex.Message;
                        }
                    };

                    movieVM.MovieDeleted += async (s, e) =>
                    {
                        try
                        {
                            await _mainWindowModel.DeleteMovie(movieVM.MovieId);
                            await LoadMoviesAsync();
                            ErrorMessage = "";
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba film törlésekor: " + ex.Message;
                        }
                    };

                    Movies.Add(movieVM);
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a filmek betöltésekor: " + ex.Message;
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
                        Room = room.RoomName,
                        MovieImage = Movies.FirstOrDefault(m => m.MovieId == screeningDto.MovieId)?.MovieImage
                    };

                    screeningVm.ShowTimes.Add(screeningDto.Date);

                    screeningVm.ScreeningSaved += async (s, dto) =>
                    {
                        try
                        {
                            await _mainWindowModel.ModifyFilmScreening(dto, dto.FilmScreeningId);
                            await LoadScreeningsAsync();
                            SelectedScreening = null;
                            IsScreeningEditPanelOpen = false;
                            ErrorMessage = "";
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba vetítés módosításakor: " + ex.Message;
                        }
                    };

                    screeningVm.ScreeningDeleted += async (s, e) =>
                    {
                        try
                        {
                            await _mainWindowModel.DeleteScreening(screeningVm.FilmScreeningId);
                            await LoadScreeningsAsync();
                            ErrorMessage = "";
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba vetítés törlésekor: " + ex.Message;
                        }
                    };

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
                    Date = SelectedDate.ToUniversalTime()
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
                await LoadScreeningsAsync();
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
                await LoadScreeningsAsync();
                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba vetítés törlésekor: " + ex.Message;
            }
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
                    var ticketVM = new TicketViewModel(this)
                    {
                        Id = ticket.Id,
                        Name = ticket.TicketName,
                        Price = ticket.Price
                    };

                    ticketVM.TicketTypeSaved += async (s, dto) =>
                    {
                        try
                        {
                            await _mainWindowModel.ModifyTicketType(dto, dto.Id);
                            await LoadTicketsAsync();
                            SelectedPriceItem = null;
                            IsTicketEditPanelOpen = false;
                            ErrorMessage = "";
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba a jegy mentésekor: " + ex.Message;
                        }
                    };

                    ticketVM.TicketTypeDeleted += async (s, e) =>
                    {
                        try
                        {
                            await DeleteTicketTypeAsync(ticketVM.Id);
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba jegy törlésekor: " + ex.Message;
                        }
                    };

                    Prices.Add(ticketVM);
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a jegyárak betöltésekor: " + ex.Message;
            }
        }

        public async Task DeleteTicketTypeAsync(int ticketTId)
        {
            try
            {
                await _mainWindowModel.DeleteTicketType(ticketTId);
                await LoadTicketsAsync();
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
                Rooms.Clear();

                var termek = await _mainWindowModel.GetAllRooms();

                foreach (var terem in termek)
                {
                    var roomVM = new RoomViewModel(this)
                    {
                        RoomId = terem.RoomId,
                        Name = terem.RoomName
                    };

                    roomVM.RoomSaved += async (s, dto) =>
                    {
                        try
                        {
                            await _mainWindowModel.ModifyRoom(dto, dto.RoomId);
                            await LoadRoomsAsync();
                            SelectedRoomItem = null;
                            IsRoomEditPanelOpen = false;
                            ErrorMessage = "";
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba terem módosításakor: " + ex.Message;
                        }
                    };

                    roomVM.RoomDeleted += async (s, e) =>
                    {
                        try
                        {
                            await _mainWindowModel.DeleteRoom(roomVM.RoomId);
                            await LoadRoomsAsync();
                            ErrorMessage = "";
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba terem törlésekor: " + ex.Message;
                        }
                    };

                    Room.Add(roomVM);
                    Rooms.Add(terem.RoomName);
                }
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
                    var reservationVM = new ReservationViewModel(this)
                    {
                        ReservationId = foglalas.PaymentReservationId,
                        CartId = foglalas.CartId,
                        Date = foglalas.Date,
                        IsPaid = foglalas.IsPaid,
                        ScreeningId = foglalas.FilmScreeningId,
                        Amount = foglalas.Amount,
                        Price = foglalas.Price,
                        UserId = foglalas.UserId,
                        Seats = foglalas.Seats ?? new List<SeatDto>()
                    };
                    reservationVM.ReservationSaved += async (s, dto) =>
                    {
                        try
                        {
                            await _mainWindowModel.ModifyReservation(dto, dto.PaymentReservationId);
                            await LoadReservationAsync();
                            SelectedReservationItem = null;
                            IsReservationEditPanelOpen = false;
                            ErrorMessage = "";
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba a foglalások mentésekor: " + ex.Message;
                        }
                    };
                    reservationVM.ReservationDeleted += async (s, e) =>
                    {
                        try
                        {
                            await _mainWindowModel.DeleteReservation(reservationVM.ReservationId);
                            await LoadReservationAsync();
                            ErrorMessage = "";
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba a foglalások törlésekor: " + ex.Message;
                        }
                    };

                    Reservations.Add(reservationVM);
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a foglalások betöltésekor: " + ex.Message;
            }
        }

        private async Task LoadReservationSeatsAsync(ReservationViewModel reservation)
        {
            try
            {
                var screening = Screenings.FirstOrDefault(x => x.FilmScreeningId == reservation.ScreeningId);
                if (screening == null)
                {
                    reservation.ErrorMessage = "A vetítés nem található.";
                    return;
                }

                var seats = await _mainWindowModel.GetSeats(screening.RoomId, reservation.ScreeningId);

                reservation.AvailableSeats.Clear();

                foreach (var seat in seats)
                {
                    var isSelected = reservation.Seats.Any(x => x.SeatId == seat.SeatId);

                    reservation.AvailableSeats.Add(new SeatSelectionViewModel
                    {
                        SeatId = seat.SeatId,
                        RowNumber = seat.RowNumber,
                        SeatNumber = seat.SeatNumber,
                        RoomId = seat.RoomId,
                        IsReserved = seat.IsReserved,
                        IsSelected = isSelected
                    });
                }
            }
            catch (Exception ex)
            {
                reservation.ErrorMessage = "Hiba a székek betöltésekor: " + ex.Message;
            }
        }

        public async Task LoadReservationSeatsForSelectedReservationAsync(ReservationViewModel reservation)
        {
            await LoadReservationSeatsAsync(reservation);
        }

        public async Task UpdateReservationAsync(ReservationViewModel reservation)
        {
            try
            {
                SelectedReservationItem = reservation;

                SelectedReservationItem.ReservationSaved += async (s, dto) =>
                {
                    try
                    {
                        await _mainWindowModel.ModifyReservation(dto, dto.PaymentReservationId);

                        await LoadReservationAsync();
                        SelectedReservationItem = null;
                        ErrorMessage = "";
                    }
                    catch (Exception ex)
                    {
                        ErrorMessage = "Hiba a foglalások mentésekor: " + ex.Message;
                    }
                };
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
        // ===================== CATEGORIES =====================
        private async Task LoadCategoriesAsync()
        {
            try
            {
                Categories.Clear();

                var categories = await _mainWindowModel.GetAllCateg();

                foreach (var category in categories)
                {
                    var categoryVM = new CategoryViewModel(this)
                    {
                        Id = category.Id,
                        Name = category.CategName,
                        Description = category.Description
                    };

                    categoryVM.CategorySaved += async (s, dto) =>
                    {
                        try
                        {
                            await _mainWindowModel.ModifyCateg(dto, dto.Id);
                            await LoadCategoriesAsync();
                            SelectedCategoryItem = null;
                            IsCategoryEditPanelOpen = false;
                            ErrorMessage = "";
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba kategória módosításakor: " + ex.Message;
                        }
                    };

                    categoryVM.CategoryDeleted += async (s, e) =>
                    {
                        try
                        {
                            await _mainWindowModel.DeleteCateg(categoryVM.Id);
                            await LoadCategoriesAsync();
                            ErrorMessage = "";
                        }
                        catch (Exception ex)
                        {
                            ErrorMessage = "Hiba kategória törlésekor: " + ex.Message;
                        }
                    };

                    Categories.Add(categoryVM);
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a kategóriák betöltésekor: " + ex.Message;
            }
        }

        // ===================== IMAGE =====================

        private async Task UploadMovieImageAsync()
        {
            try
            {
                if (_hostWindow == null)
                {
                    ErrorMessage = "Az ablak referencia nem elérhető.";
                    return;
                }

                if (SelectedMovieItem == null)
                {
                    ErrorMessage = "Nincs kiválasztott film.";
                    return;
                }

                var files = await _hostWindow.StorageProvider.OpenFilePickerAsync(new FilePickerOpenOptions
                {
                    Title = "Kép kiválasztása",
                    AllowMultiple = false,
                    FileTypeFilter = new[]
                    {
                new FilePickerFileType("Képek")
                {
                    Patterns = new[] { "*.png", "*.jpg", "*.jpeg", "*.bmp", "*.webp" }
                }
            }
                });

                var file = files.FirstOrDefault();
                if (file == null)
                    return;

                await using var stream = await file.OpenReadAsync();
                using var ms = new MemoryStream();
                await stream.CopyToAsync(ms);
                var imageBytes = ms.ToArray();

                var dto = new ImageDto
                {
                    ImageContent = imageBytes
                };

                var savedImage = await _mainWindowModel.UploadImage(dto);

                SelectedMovieItem.ImageId = savedImage.ImageId;
                SelectedMovieItem.MovieImage = new Bitmap(new MemoryStream(imageBytes));

                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba kép feltöltésekor: " + ex.Message;
            }
        }

        private async Task LoadMovieImageAsync()
        {
            try
            {
                if (SelectedMovieItem == null)
                {
                    ErrorMessage = "Nincs kiválasztott film.";
                    return;
                }

                if (SelectedMovieItem.MovieId == 0)
                {
                    ErrorMessage = "A film még nincs elmentve.";
                    return;
                }

                var image = await _mainWindowModel.GetImage(SelectedMovieItem.MovieId);

                if (image == null || image.ImageContent == null || image.ImageContent.Length == 0)
                {
                    SelectedMovieItem.MovieImage = null;
                    ErrorMessage = "Ehhez a filmhez nincs kép.";
                    return;
                }

                SelectedMovieItem.ImageId = image.ImageId;
                SelectedMovieItem.MovieImage = new Bitmap(new MemoryStream(image.ImageContent));

                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba kép betöltésekor: " + ex.Message;
            }
        }

        private async Task DeleteMovieImageAsync()
        {
            try
            {
                if (SelectedMovieItem == null)
                {
                    ErrorMessage = "Nincs kiválasztott film.";
                    return;
                }

                if (SelectedMovieItem.ImageId == 0)
                {
                    ErrorMessage = "Nincs törölhető kép.";
                    return;
                }

                await _mainWindowModel.DeleteImage(SelectedMovieItem.ImageId);

                SelectedMovieItem.MovieImage = null;
                SelectedMovieItem.ImageId = 0;

                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba kép törlésekor: " + ex.Message;
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

        private void OpenMoviePage()
        {
            IsMenuOpen = false;
            IsMoviePageOpen = true;
        }

        public void OpenMovieAddPanel()
        {
            SelectedMovieItem = new MovieViewModel(this);

            SelectedMovieItem.MovieAddSaved += async (s, dto) =>
            {
                try
                {
                    await _mainWindowModel.NewMovie(dto);
                    await LoadMoviesAsync();
                    SelectedMovieItem = null;
                    IsMovieAddPanelOpen = false;
                    ErrorMessage = "";
                }
                catch (Exception ex)
                {
                    ErrorMessage = "Hiba új film mentésekor: " + ex.Message;
                }
            };

            IsMovieAddPanelOpen = true;
            IsMovieEditPanelOpen = false;
            ErrorMessage = "";
        }

        private void CloseMoviePage()
        {
            IsMoviePageOpen = false;
            IsMovieEditPanelOpen = false;
            IsMovieAddPanelOpen = false;
            SelectedMovieItem = null;
            ErrorMessage = "";
        }

        private void CloseMovieEditPanel()
        {
            IsMovieEditPanelOpen = false;
            SelectedMovieItem = null;
            ErrorMessage = "";
        }

        private void CloseMovieAddPanel()
        {
            IsMovieAddPanelOpen = false;
            SelectedMovieItem = null;
            ErrorMessage = "";
        }

        private void OpenTicketAddPanel()
        {
            SelectedPriceItem = new TicketViewModel(this);

            SelectedPriceItem.TicketTypeAddSaved += async (s, dto) =>
            {
                try
                {
                    await _mainWindowModel.NewTicketType(dto);
                    await LoadTicketsAsync();
                    SelectedPriceItem = null;
                    IsTicketAddPanelOpen = false;
                    ErrorMessage = "";
                }
                catch (Exception ex)
                {
                    ErrorMessage = "Hiba új jegy mentésekor: " + ex.Message;
                }
            };

            IsTicketAddPanelOpen = true;
            IsTicketEditPanelOpen = false;
            ErrorMessage = "";
        }

        private void OpenTicketPage()
        {
            IsMenuOpen = false;
            IsTicketsPageOpen = true;
        }

        private void CloseTicketAddPanel()
        {
            IsTicketAddPanelOpen = false;
            SelectedPriceItem = null;
            ErrorMessage = "";
        }

        private void CloseTicketEditPanel()
        {
            IsTicketEditPanelOpen = false;
            SelectedPriceItem = null;
            ErrorMessage = "";
        }

        private void CloseTicketPage()
        {
            IsTicketsPageOpen = false;
            IsTicketAddPanelOpen = false;
            IsTicketEditPanelOpen = false;
            SelectedPriceItem = null;
            ErrorMessage = "";
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

        private void OpenRoomAddPanel()
        {
            SelectedRoomItem = new RoomViewModel(this);

            SelectedRoomItem.RoomAddSaved += async (s, dto) =>
            {
                try
                {
                    await _mainWindowModel.NewRoom(dto);
                    await LoadRoomsAsync();
                    SelectedRoomItem = null;
                    IsRoomAddPanelOpen = false;
                    ErrorMessage = "";
                }
                catch (Exception ex)
                {
                    ErrorMessage = "Hiba új terem mentésekor: " + ex.Message;
                }
            };

            IsRoomAddPanelOpen = true;
            IsRoomEditPanelOpen = false;
            ErrorMessage = "";
        }

        private void OpenRoomPage()
        {
            IsMenuOpen = false;
            IsRoomPageOpen = true;
        }

        private void CloseRoomAddPanel()
        {
            IsRoomAddPanelOpen = false;
            SelectedRoomItem = null;
            ErrorMessage = "";
        }

        private void CloseRoomEditPanel()
        {
            IsRoomEditPanelOpen = false;
            SelectedRoomItem = null;
            ErrorMessage = "";
        }

        private void CloseRoomPage()
        {
            IsRoomPageOpen = false;
            IsRoomAddPanelOpen = false;
            IsRoomEditPanelOpen = false;
            SelectedRoomItem = null;
            ErrorMessage = "";
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

        private void OpenCategoryPage()
        {
            IsMenuOpen = false;
            IsCategoryPageOpen = true;
        }

        private void OpenCategoryAddPanel()
        {
            SelectedCategoryItem = new CategoryViewModel(this);

            SelectedCategoryItem.CategoryAddSaved += async (s, dto) =>
            {
                try
                {
                    await _mainWindowModel.NewCateg(dto);
                    await LoadCategoriesAsync();
                    SelectedCategoryItem = null;
                    IsCategoryAddPanelOpen = false;
                    ErrorMessage = "";
                }
                catch (Exception ex)
                {
                    ErrorMessage = "Hiba új kategória mentésekor: " + ex.Message;
                }
            };

            IsCategoryAddPanelOpen = true;
            IsCategoryEditPanelOpen = false;
            ErrorMessage = "";
        }

        private void CloseCategoryPage()
        {
            IsCategoryPageOpen = false;
            IsCategoryAddPanelOpen = false;
            IsCategoryEditPanelOpen = false;
            SelectedCategoryItem = null;
            ErrorMessage = "";
        }

        private void CloseCategoryAddPanel()
        {
            IsCategoryAddPanelOpen = false;
            SelectedCategoryItem = null;
            ErrorMessage = "";
        }

        private void CloseCategoryEditPanel()
        {
            IsCategoryEditPanelOpen = false;
            SelectedCategoryItem = null;
            ErrorMessage = "";
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
