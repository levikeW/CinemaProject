using CinemaProject;
using System.Net;
using System.Text.Json;
using Xunit;

namespace Cinema_IntegrationTest;

public class WeatherForecastControllerTest : IClassFixture<CustomApplicationFactory>
{
    private readonly HttpClient _client;

    public WeatherForecastControllerTest(CustomApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetWeatherForecast()
    {
        var response = await _client.GetAsync("/weatherforecast");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var forecasts = JsonSerializer.Deserialize<List<WeatherForecast>>(
            await response.Content.ReadAsStringAsync(),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.NotEmpty(forecasts);
    }
}