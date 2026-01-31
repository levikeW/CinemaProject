using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CinemaProject_Avalonia.ViewModels
{
    public class PriceViewModel : ViewModelBase
    {
        public MainWindowViewModel _viewModel;

        private string _name;
        private decimal _amount;

        public event EventHandler? PriceDeleted;

        public RelayCommand OpenEditPanelCommand { get; }
        public RelayCommand DeleteCommand { get; }
        public decimal Amount
        {
            get => _amount;
            set
            {
                _amount = value;
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

        public PriceViewModel(MainWindowViewModel viewModel)
        {
            _viewModel = viewModel;
            _amount = Amount;
            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            DeleteCommand = new RelayCommand(Delete);
        }

        private void OpenEditPanel()
        {
            _viewModel.SelectedPriceItem = this;
            _viewModel.IsEditPanelOpen = true;
        }

        private void Delete()
        {
            PriceDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
