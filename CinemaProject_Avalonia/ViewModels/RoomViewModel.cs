using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.Input;

namespace CinemaProject_Avalonia.ViewModels
{
    public class RoomViewModel : ViewModelBase
    {
        public MainWindowViewModel _viewModel;

        private int _roomId;
        private string _name;

        public event EventHandler? RoomDeleted;

        public RelayCommand OpenEditPanelCommand { get; }
        public RelayCommand DeleteCommand { get; }

        public int RoomId
        {
            get => _roomId;
            set
            {
                _roomId = value;
                OnPropertyChanged();
            }
        }

        public string Name
        {
            get => _name;
            set
            {
                _name = value;
                OnPropertyChanged();
            }
        }

        public RoomViewModel(MainWindowViewModel viewModel)
        {
            _viewModel = viewModel;

            _name = Name;

            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            DeleteCommand = new RelayCommand(Delete);
        }

        private void OpenEditPanel()
        {
            _viewModel.SelectedRoomItem = this;
            _viewModel.IsScreeningEditPanelOpen = true;
        }

        private void Delete()
        {
            RoomDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
