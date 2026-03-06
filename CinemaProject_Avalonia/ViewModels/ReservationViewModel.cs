using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Avalonia;
using CinemaProject.Dto;
using CinemaProject.Persistence;
using CinemaProject_Avalonia.Models;
using CommunityToolkit.Mvvm.Input;

namespace CinemaProject_Avalonia.ViewModels
{
    public class ReservationViewModel : ViewModelBase
    {   
        private readonly MainWindowModel _model;
        public MainWindowViewModel _viewModel;

        private int _reservationId;
        private int _cartId;
        private DateTimeOffset _date;
        private bool _isPaid;
        private int _screeningId;
        private int _amount;
        private int _price;
        private int _userId;
        private List<Seat> _seats;

        private string _errorMessage;

        public RelayCommand OpenEditPanelCommand { get; }
        public RelayCommand DeleteCommand { get; }
        public AsyncRelayCommand SaveReservationCommand { get; }

        public event EventHandler? ReservationSaved;
        public event EventHandler? ReservationDeleted;


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

        public List<Seat> Seats
        {
            get=> _seats;
            set
            {
                _seats = value;
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

        public ReservationViewModel(MainWindowViewModel viewModel, MainWindowModel model)
        {
            _model = model;
            _viewModel = viewModel;

            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            SaveReservationCommand = new AsyncRelayCommand(SaveReservation);
            DeleteCommand = new RelayCommand(Delete);
        }

        public async Task SaveReservation()
        {
            try
            {
                var dto = new PaymentReservationDto
                {
                    PaymentReservationId = ReservationId,
                    Date = Date.UtcDateTime,
                    IsPaid = IsPaid,
                    FilmScreeningId = ScreeningId,
                    Amount = Amount,
                    Price = Price,
                    UserId = UserId,
                    Seats = Seats,
                };

                await _model.ModifyReservation(dto, ReservationId);

                ReservationSaved?.Invoke(this, EventArgs.Empty);
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a film mentésekor: " + ex.Message;
            }
        }

        private void OpenEditPanel()
        {
            _viewModel.SelectedReservationItem = this;
            _viewModel.IsReservationEditPanelOpen = true;
        }

        private void Delete()
        {
            ReservationDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
