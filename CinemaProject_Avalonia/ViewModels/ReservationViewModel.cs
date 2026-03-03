using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.Input;

namespace CinemaProject_Avalonia.ViewModels
{
    public class ReservationViewModel : ViewModelBase
    {
        public MainWindowViewModel _viewModel;

        private DateTimeOffset _date;
        private bool _isPaid;
        private int _screeningId;
        private int _amount;
        private int _price;
        private int _userId;

        public event EventHandler? ReservationDeleted;

        public RelayCommand OpenEditPanelCommand { get; }
        public RelayCommand DeleteCommand { get; }

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

        public ReservationViewModel(MainWindowViewModel viewModel)
        {
            _viewModel = viewModel;

            _date = Date;
            _isPaid = IsPaid;
            _screeningId = ScreeningId;
            _amount = Amount;
            _price = Price;
            _userId = UserId;

            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            DeleteCommand = new RelayCommand(Delete);
        }

        private void OpenEditPanel()
        {
            _viewModel.SelectedReservationItem = this;
            _viewModel.IsEditPanelOpen = true;
        }

        private void Delete()
        {
            ReservationDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
