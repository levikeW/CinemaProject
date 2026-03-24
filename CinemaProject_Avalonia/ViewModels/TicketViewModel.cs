using CinemaProject.Dto;
using CinemaProject.Persistence;
using CinemaProject_Avalonia.Models;
using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace CinemaProject_Avalonia.ViewModels
{
    public class TicketViewModel : ViewModelBase
    {
        public MainWindowViewModel _viewModel;

        private int _ticketId;
        private string _ticketType;
        private int _ticketPrice;

        private string _errorMessage;

        public event EventHandler? TicketTypeDeleted;
        public event EventHandler<ModifyTicketTypeDto> TicketTypeSaved;
        public event EventHandler<NewTicketTypeDto> TicketTypeAddSaved;

        public RelayCommand OpenEditPanelCommand { get; }
        public AsyncRelayCommand SaveTicketTypeCommand { get; }
        public RelayCommand DeleteCommand { get; }

        public int TicketId
        {
            get => _ticketId;
            set
            {
                _ticketId = value;
                OnPropertyChanged();
            }
        }
        public string TicketType
        {
            get => _ticketType;
            set
            {
                _ticketType = value;
                OnPropertyChanged();
            }
        }
        public int TicketPrice
        {
            get => _ticketPrice;
            set
            {
                _ticketPrice = value;
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

        public TicketViewModel(MainWindowViewModel viewModel)
        {
            _viewModel = viewModel;

            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            SaveTicketTypeCommand = new AsyncRelayCommand(SaveTicketType);
            DeleteCommand = new RelayCommand(Delete);
        }

        public async Task SaveTicketType()
        {
            try
            {
                if (string.IsNullOrWhiteSpace(TicketType))
                {
                    ErrorMessage = "A jegy nevét kötelező megadni.";
                    return;
                }

                if (TicketPrice <= 0)
                {
                    ErrorMessage = "Az ár legyen nagyobb mint 0.";
                    return;
                }

                if (TicketId == 0)
                {
                    var addDto = new NewTicketTypeDto
                    {
                        TicketType = TicketType,
                        TicketPrice = TicketPrice
                    };

                    TicketTypeAddSaved?.Invoke(this, addDto);
                }
                else
                {
                    var dto = new ModifyTicketTypeDto
                    {
                        TicketTypeId = TicketId,
                        TicketType = TicketType,
                        TicketPrice = TicketPrice
                    };

                    TicketTypeSaved?.Invoke(this, dto);
                }

                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba az adatok előkészítésekor: " + ex.Message;
            }
        }

        private void OpenEditPanel()
        {
            _viewModel.SelectedTicketTypeItem = this;
            _viewModel.IsTicketAddPanelOpen = false;
            _viewModel.IsTicketEditPanelOpen = true;
        }

        private void Delete()
        {
            TicketTypeDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
