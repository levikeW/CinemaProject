using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CinemaProject.Dto;
using CommunityToolkit.Mvvm.Input;
namespace CinemaProject_Avalonia.ViewModels
{
    public class CategoryViewModel : ViewModelBase
    {
        public MainWindowViewModel _viewModel;

        private int _id;
        private string _name = "";
        private string _description = "";
        private string _errorMessage = "";

        public event EventHandler? CategoryDeleted;
        public event EventHandler<ModifyCategDto>? CategorySaved;
        public event EventHandler<NewCategDto>? CategoryAddSaved;

        public RelayCommand OpenEditPanelCommand { get; }
        public AsyncRelayCommand SaveCategoryCommand { get; }
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

        public string Description
        {
            get => _description;
            set
            {
                _description = value;
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

        public CategoryViewModel(MainWindowViewModel viewModel)
        {
            _viewModel = viewModel;

            OpenEditPanelCommand = new RelayCommand(OpenEditPanel);
            SaveCategoryCommand = new AsyncRelayCommand(SaveCategory);
            DeleteCommand = new RelayCommand(Delete);
        }

        public async Task SaveCategory()
        {
            try
            {
                if (string.IsNullOrWhiteSpace(Name))
                {
                    ErrorMessage = "A kategória nevét kötelező megadni.";
                    return;
                }

                if (Id == 0)
                {
                    var addDto = new NewCategDto
                    {
                        Name = Name,
                        Description = Description
                    };

                    CategoryAddSaved?.Invoke(this, addDto);
                }
                else
                {
                    var dto = new ModifyCategDto
                    {
                        CategId = Id,
                        Name = Name,
                        Description = Description
                    };

                    CategorySaved?.Invoke(this, dto);
                }

                ErrorMessage = "";
            }
            catch (Exception ex)
            {
                ErrorMessage = "Hiba a kategória mentésekor: " + ex.Message;
            }
        }

        private void OpenEditPanel()
        {
            _viewModel.SelectedCategoryItem = this;
            _viewModel.IsCategoryAddPanelOpen = false;
            _viewModel.IsCategoryEditPanelOpen = true;
        }

        private void Delete()
        {
            CategoryDeleted?.Invoke(this, EventArgs.Empty);
        }
    }
}
