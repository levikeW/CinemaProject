using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CinemaProject.Dto;
using CommunityToolkit.Mvvm.Input;

namespace CinemaProject_Avalonia.ViewModels
{
    public class RoomViewModel : ViewModelBase
    {
        public MainWindowViewModel _viewModel;

        private int _roomId;
        private string _name = "";

        private string _errorMessage = "";

        public event EventHandler? RoomDeleted;
        public event EventHandler<ModifyRoomDto> RoomSaved;
        public event EventHandler<NewRoomDto> RoomAddSaved;

        public RelayCommand OpenEditPanelCommand { get; }
        public RelayCommand DeleteCommand { get; }
        public AsyncRelayCommand SaveRoomCommand { get; }

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
        public string ErrorMessage
        {
            get => _errorMessage;
            set
            {
                _errorMessage = value;
                OnPropertyChanged();
            }
        }

        public RoomViewModel(MainWindowViewModel viewModel)
        {
            _viewModel = viewModel;

            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            DeleteCommand = new RelayCommand(Delete);
            SaveRoomCommand = new AsyncRelayCommand(SaveRoom);
        }

        public async Task SaveRoom()
        {
            try
            {
                if (string.IsNullOrWhiteSpace(Name))
                {
                    ErrorMessage = "A terem nevét kötelező megadni.";
                    return;
                }

                if (RoomId == 0)
                {
                    var addDto = new NewRoomDto
                    {
                        RoomName = Name
                    };

                    RoomAddSaved?.Invoke(this, addDto);
                }
                else
                {
                    var dto = new ModifyRoomDto
                    {
                        RoomId = RoomId,
                        RoomName = Name
                    };

                    RoomSaved?.Invoke(this, dto);
                }

                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a terem mentésekor: " + ex.Message;
            }
        }

        private void OpenEditPanel()
        {
            _viewModel.SelectedRoomItem = this;
            _viewModel.IsRoomAddPanelOpen = false;
            _viewModel.IsRoomEditPanelOpen = true;
        }

        private void Delete()
        {
            RoomDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
