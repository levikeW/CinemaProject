using System.Collections.Generic;
using System.Collections.ObjectModel;
using System;

namespace CinemaProject_Avalonia.ViewModels
{
    public partial class MainWindowViewModel : ViewModelBase
    {
        public ObservableCollection<string> Locations { get; set; }
        public ObservableCollection<string> Categories { get; set; }
        public ObservableCollection<string> Movies { get; set; }
        private string _selectedLocation;
        private string _selectedCategory;
        private string _selectedMovie;
        private DateTimeOffset _selectedDate = DateTime.Today;
        public string SelectedLocation
        {
            get => _selectedLocation;
            set
            {
                _selectedLocation = value;
                OnPropertyChanged();
            }
        }
        public string SelectedCategory
        {
            get => _selectedCategory;
            set
            {
                _selectedCategory = value;
                OnPropertyChanged();
            }
        }
        public string SelectedMovie
        {
            get => _selectedMovie;
            set
            {
                _selectedMovie = value;
                OnPropertyChanged();
            }
        }

        public DateTimeOffset SelectedDate
        {
            get => _selectedDate;
            set
            {
                _selectedDate = value;
                OnPropertyChanged();
            }
        }
        public MainWindowViewModel()
        {
            Locations = new ObservableCollection<string>
            {
                "Budapest-Aréna Mall", "Budapest-Duna Plaza"
            };
            Categories = new ObservableCollection<string>
            {
                "Akció", "Vígjáték", "Családi"
            };
            Movies = new ObservableCollection<string>
            {
                "Film 1", "Film 2", "Film 3"
            };
        }
    }
}
