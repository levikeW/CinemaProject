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

        private int _id;
        private string _name;
        private int _price;

        private string _errorMessage;

        public event EventHandler? TicketTypeDeleted;
        public event EventHandler<ModifyTicketTypeDto> TicketTypeSaved;
        public event EventHandler<NewTicketTypeDto> TicketTypeAddSaved;

        public RelayCommand OpenEditPanelCommand { get; }
        public AsyncRelayCommand SaveTicketTypeCommand { get; }
        public RelayCommand DeleteCommand { get; }

        public int Id
        {
            get => _id;
            set
            {
                _id = value;
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
        public int Price
        {
            get => _price;
            set
            {
                _price = value;
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
                if (string.IsNullOrWhiteSpace(Name))
                {
                    ErrorMessage = "A jegy nevét kötelező megadni.";
                    return;
                }

                if (Price <= 0)
                {
                    ErrorMessage = "Az ár legyen nagyobb mint 0.";
                    return;
                }

                if (Id == 0)
                {
                    var addDto = new NewTicketTypeDto
                    {
                        Name = Name,
                        Price = Price
                    };

                    TicketTypeAddSaved?.Invoke(this, addDto);
                }
                else
                {
                    var dto = new ModifyTicketTypeDto
                    {
                        TicketTypeId = Id,
                        Name = Name,
                        Price = Price
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
            _viewModel.SelectedPriceItem = this;
            _viewModel.IsTicketAddPanelOpen = false;
            _viewModel.IsTicketEditPanelOpen = true;
        }

        private void Delete()
        {
            TicketTypeDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
