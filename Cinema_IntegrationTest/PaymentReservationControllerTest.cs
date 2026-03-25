using CinemaProject.Dto;
using CinemaProject.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Text.Json;
using Xunit;

namespace Cinema_IntegrationTest;

public class PaymentReservationControllerTest : IClassFixture<CustomApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomApplicationFactory _factory;

    public PaymentReservationControllerTest(CustomApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateReservation()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var cart = db.carts.First();

        var response = await _client.PostAsync($"/api/payment_reservation/createreservation?cartId={cart.CartId}", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CancelReservation()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

        var reservation = db.paymentReservations
            .First(r => r.IsPaid == false);

        var response = await _client.DeleteAsync(
            $"/api/payment_reservation/cancelreservation?reservationId={reservation.PaymentReservationId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PayReservation()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

        var reservation = db.paymentReservations
            .First(r => r.IsPaid == false);

        var response = await _client.PutAsync(
            $"/api/payment_reservation/payreservation?reservationId={reservation.PaymentReservationId}",
            null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetReceipt()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

        var reservation = db.paymentReservations
            .First(r => r.IsPaid == true);

        var response = await _client.GetAsync(
            $"/api/payment_reservation/getreceipt?reservationId={reservation.PaymentReservationId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var receipt = JsonSerializer.Deserialize<ReceiptDto>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(receipt);
    }

    [Fact]
    public async Task GetConfirmation()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

        var reservation = db.paymentReservations
            .First(r => r.IsPaid == true);

        var response = await _client.GetAsync(
            $"/api/payment_reservation/getconfirmation?reservationId={reservation.PaymentReservationId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var confirmation = JsonSerializer.Deserialize<ConfirmationDto>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(confirmation);
    }

    [Fact]
    public async Task ViewUpcomingReservations()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var user = db.users.First();

        var response = await _client.GetAsync($"/api/payment_reservation/viewupcomingreservation?userId={user.UserId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var reservations = JsonSerializer.Deserialize<List<PaymentReservationDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(reservations);
    }

    [Fact]
    public async Task ViewPastReservations()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();
        var user = db.users.First();

        var response = await _client.GetAsync($"/api/payment_reservation/viewpastreservation?userId={user.UserId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var reservations = JsonSerializer.Deserialize<List<PaymentReservationDto>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotNull(reservations);
    }
}