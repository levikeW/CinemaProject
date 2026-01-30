using Avalonia.Controls;
using Avalonia.Input;

namespace CinemaProject_Avalonia.Views
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            this.WindowState = WindowState.Maximized;
        }
        private void Overlay_PointerPressed(object? sender, PointerPressedEventArgs e)
        {
            if (DataContext is ViewModels.MainWindowViewModel vm)
            {
                vm.IsMenuOpen = false;
            }
        }

        private void Menu_PointerPressed(object? sender, PointerPressedEventArgs e)
        {
            e.Handled = true;
        }
    }
}