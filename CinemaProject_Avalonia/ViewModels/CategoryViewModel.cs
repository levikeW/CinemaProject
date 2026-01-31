using CommunityToolkit.Mvvm.Input;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CinemaProject_Avalonia.ViewModels
{
    public class CategoryViewModel : ViewModelBase
    {
        public MainWindowViewModel _viewModel;

        private string _name;

        public event EventHandler? CategoryDeleted;

        public RelayCommand OpenEditPanelCommand { get; }
        public RelayCommand DeleteCommand { get; }
        public string Name
        {
            get => _name;
            set
            {
                _name = value;
                OnPropertyChanged();
            }
        }
        public CategoryViewModel(MainWindowViewModel viewModel)
        {
            _viewModel = viewModel;
            _name = Name;
            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            DeleteCommand = new RelayCommand(Delete);
        }

        private void OpenEditPanel()
        {
            _viewModel.SelectedCategoryItem = this;
            _viewModel.IsEditPanelOpen = true;
        }

        private void Delete()
        {
            CategoryDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
