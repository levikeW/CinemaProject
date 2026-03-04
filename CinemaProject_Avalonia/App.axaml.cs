using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Data.Core;
using Avalonia.Data.Core.Plugins;
using Avalonia.Markup.Xaml;
using CinemaProject_Avalonia.Models;
using CinemaProject_Avalonia.ViewModels;
using CinemaProject_Avalonia.Views;
using System.Diagnostics;
using System.Linq;

namespace CinemaProject_Avalonia
{
    public static class SessionStore
    {
        public static ApiSession Session { get; } = new ApiSession("https://localhost:7199", acceptAnyCert: true);
    }
    public partial class App : Application
    {
        public static ApiSession session { get; private set; }
        public override void Initialize()
        {
            AvaloniaXamlLoader.Load(this);
        }

        public override void OnFrameworkInitializationCompleted()
        {
            if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
            {
                // Avoid duplicate validations from both Avalonia and the CommunityToolkit. 
                // More info: https://docs.avaloniaui.net/docs/guides/development-guides/data-validation#manage-validationplugins
                DisableAvaloniaDataAnnotationValidation();

                session = new ApiSession("https://localhost:7199",acceptAnyCert: true);
                var authModel = new AuthModel(session);

                var loginViewModel = new LoginViewModel(authModel);    
                var mainModel = new MainWindowModel(session);
                var viewModel = new MainWindowViewModel(mainModel);

                var loginWindow = new LoginWindow
                {
                    DataContext = loginViewModel
                };

                loginViewModel.NavigationToMainRequested += async (s, e) =>
                {
                    var mainWindow = new MainWindow
                    {
                        DataContext = viewModel
                    };

                    await viewModel.InitializeAfterLoginAsync();

                    viewModel.ExitToNavigationRequest += (s2, e2) =>
                    {
                        var newLoginWindow = new LoginWindow
                        {
                            DataContext = new LoginViewModel(authModel)
                        };

                        desktop.MainWindow = newLoginWindow;
                        newLoginWindow.Show();
                        mainWindow.Close();
                    };

                    desktop.MainWindow = mainWindow;
                    mainWindow.Show();
                    loginWindow.Close();
                };

                desktop.MainWindow = loginWindow;
            }

            base.OnFrameworkInitializationCompleted();
        }

        private void DisableAvaloniaDataAnnotationValidation()
        {
            // Get an array of plugins to remove
            var dataValidationPluginsToRemove =
                BindingPlugins.DataValidators.OfType<DataAnnotationsValidationPlugin>().ToArray();

            // remove each entry found
            foreach (var plugin in dataValidationPluginsToRemove)
            {
                BindingPlugins.DataValidators.Remove(plugin);
            }
        }
    }
}