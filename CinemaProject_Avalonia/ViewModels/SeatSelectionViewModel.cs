using Cinema.Dto;

namespace CinemaProject_Avalonia.ViewModels
{
    public class SeatSelectionViewModel : ViewModelBase
    {
        private bool _isSelected;

        public int SeatId { get; set; }
        public int RowNumber { get; set; }
        public int SeatNumber { get; set; }
        public int RoomId { get; set; }
        public bool IsReserved { get; set; }

        public bool IsSelected
        {
            get => _isSelected;
            set
            {
                _isSelected = value;
                OnPropertyChanged();
            }
        }

        public string DisplayText => $"Sor {RowNumber}, Szék {SeatNumber}";
    }
}