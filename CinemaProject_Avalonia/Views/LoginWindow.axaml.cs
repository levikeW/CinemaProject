using Avalonia;
using Avalonia.Controls;
using Avalonia.Markup.Xaml;
using CinemaProject_Avalonia.Models;
using CinemaProject_Avalonia.ViewModels;
using CinemaProject_Avalonia.Views;
using System;

namespace CinemaProject_Avalonia;

public partial class LoginWindow : Window
{
    public LoginWindow()
    {
        InitializeComponent();

        var session = new ApiSession("https://localhost:7199/");
        var authModel = new AuthModel(session);
        var vm = new LoginViewModel(session, authModel);

        vm.NavigationToMainRequested += OnNavigationToMainRequested;

        DataContext = vm;
    }

    private void OnNavigationToMainRequested(object? sender, EventArgs e)
    {
        var mainWindow = new MainWindow();

        mainWindow.Show();
        this.Close();
    }
}