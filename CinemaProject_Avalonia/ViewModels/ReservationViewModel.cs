using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Avalonia;
using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using CinemaProject_Avalonia.Models;
using CommunityToolkit.Mvvm.Input;
using Tmds.DBus.Protocol;

namespace CinemaProject_Avalonia.ViewModels
{
    public class ReservationViewModel : ViewModelBase
    {
        public MainWindowViewModel _viewModel;

        private ObservableCollection<SeatSelectionViewModel> _availableSeats = new();

        private int _reservationId;
        private int _cartId;
        private DateTimeOffset _date;
        private bool _isPaid;
        private int _screeningId;
        private int _amount;
        private int _price;
        private int _userId;
        private List<SeatDto> _seats = new();

        private string _errorMessage;

        public AsyncRelayCommand OpenEditPanelCommand { get; }
        public RelayCommand DeleteCommand { get; }
        public AsyncRelayCommand SaveReservationCommand { get; }

        public event EventHandler<ModifyReservationDto> ReservationSaved;
        public event EventHandler? ReservationDeleted;

        public ObservableCollection<SeatSelectionViewModel> AvailableSeats
        {
            get => _availableSeats;
            set
            {
                _availableSeats = value;
                OnPropertyChanged();
            }
        }

        public int ReservationId
        {
            get => _reservationId;
            set
            {
                _reservationId = value;
                OnPropertyChanged();
            }
        }
        public int CartId
        {
            get => _cartId;
            set
            {
                _cartId = value;
                OnPropertyChanged();
            }
        }
        public DateTimeOffset Date
        {
            get => _date;
            set
            {
                _date = value;
                OnPropertyChanged();
            }
        }

        public bool IsPaid
        {
            get => _isPaid;
            set
            {
                _isPaid = value;
                OnPropertyChanged();
            }
        }

        public int ScreeningId
        {
            get => _screeningId;
            set
            {
                _screeningId = value;
                OnPropertyChanged();
            }
        }

        public int Amount
        {
            get => _amount;
            set
            {
                _amount = value;
                OnPropertyChanged();
            }
        }

        public int Price
        {
            get => _price;
            set
            {
                _price = value;
                OnPropertyChanged();
            }
        }

        public int UserId
        {
            get => _userId;
            set
            {
                _userId = value;
                OnPropertyChanged();
            }
        }

        public List<SeatDto> Seats
        {
            get => _seats;
            set
            {
                _seats = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(SeatsDisplay));
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

        public string SeatsDisplay
        {
            get
            {
                if (Seats == null || Seats.Count == 0)
                    return "Nincsenek megadott helyek";
                return string.Join(", ", Seats.Select(s => $"Sor: {s.RowNumber}, Szék: {s.SeatNumber}"));
            }
        }

        public ReservationViewModel(MainWindowViewModel viewModel)
        {
            _viewModel = viewModel;

            OpenEditPanelCommand = new AsyncRelayCommand(OpenEditPanel);
            SaveReservationCommand = new AsyncRelayCommand(SaveReservation);
            DeleteCommand = new RelayCommand(Delete);
        }

        public async Task SaveReservation()
        {
            try
            {
                if (Amount <= 0)
                {
                    ErrorMessage = "A jegyek száma legyen nagyobb mint 0.";
                    return;
                }

                var selectedSeats = AvailableSeats.Where(x => x.IsSelected)
                    .Select(x => new SeatDto
                    {
                        SeatId = x.SeatId,
                        RowNumber = x.RowNumber,
                        SeatNumber = x.SeatNumber,
                        RoomId = x.RoomId,
                        IsReserved = x.IsReserved,
                    }).ToList();

                var dto = new ModifyReservationDto
                {
                    PaymentReservationId = ReservationId,
                    CartId = CartId,
                    Date = Date,
                    IsPaid = IsPaid,
                    FilmScreeningId = ScreeningId,
                    Amount = Amount,
                    Price = Price,
                    UserId = UserId,
                    Seats = selectedSeats
                };

                Seats = selectedSeats;
                ReservationSaved?.Invoke(this, dto);

                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a foglalás mentésekor: " + ex.Message;
            }
            await Task.CompletedTask;
        }

        private async Task OpenEditPanel()
        {
            _viewModel.SelectedReservationItem = this;
            _viewModel.IsReservationEditPanelOpen = true;
            await _viewModel.LoadReservationSeatsForSelectedReservationAsync(this);
        }

        private void Delete()
        {
            ReservationDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
