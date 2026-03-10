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
        public MainWindowModel _mainWindowModel;
        public MainWindowViewModel _viewModel;

        private int _id;
        private string _name;
        private int _price;

        private string _errorMessage;

        public event EventHandler? PriceDeleted;
        public event EventHandler<ModifyTicketTypeDto> PriceSaved;

        public RelayCommand OpenEditPanelCommand { get; }
        public AsyncRelayCommand SaveTicketCommand { get; }
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

        public TicketViewModel(MainWindowViewModel viewModel, MainWindowModel model)
        {
            _mainWindowModel = model;
            _viewModel = viewModel;

            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            SaveTicketCommand = new AsyncRelayCommand(SavePrice);
            DeleteCommand = new RelayCommand(Delete);
        }

        public async Task SavePrice()
        {
            try
            {
                var dto = new ModifyTicketTypeDto
                {
                    Id = Id,
                    TicketName = Name,
                    Price = Price
                };

                PriceSaved?.Invoke(this, dto);

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
            _viewModel.IsScreeningEditPanelOpen = true;
        }

        private void Delete()
        {
            PriceDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
