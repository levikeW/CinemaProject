using CinemaProject.Model;
using CinemaProject.Persistence;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

//ADD CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            // when using credentials (cookies/auth) the origin cannot be '*' – must specify exact hosts
            policy
                .WithOrigins("http://127.0.0.1:5500", "http://localhost:5500")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});

// Add services to the container.
builder.Services.AddDbContextPool<CinemaDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("CinemaDb")));
builder.Services.AddTransient<UserModel>();
builder.Services.AddTransient<AdminModel>();
builder.Services.AddTransient<CinemaModel>();
builder.Services.AddTransient<CartModel>();
builder.Services.AddTransient<Payment_ReservationModel>();

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options => {
        options.LoginPath = "/api/User/login";
        options.LogoutPath = "/api/User/logout";

        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.None;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

        options.Events = new CookieAuthenticationEvents
        {
            OnRedirectToLogin = ctx =>
            {
                ctx.Response.StatusCode = 401;
                return Task.CompletedTask;
            },
            OnRedirectToAccessDenied = ctx =>
            {
                ctx.Response.StatusCode = 403;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
var app = builder.Build();

//  Adatb�zis l�trehoz�sa �s seedel�s
/*using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<CinemaDbContext>();
    var seeder = services.GetRequiredService<DbSeeder>();

    // L�trehozza az adatb�zist �s a t�bl�kat, ha nem l�teznek
      var databaseCreated = context.Database.EnsureCreated();

    // Seedel�s csak, ha �res az adatb�zis
     if (databaseCreated)
    {
        seeder.Seed();
    }
}*/


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
//app.UseHttpsRedirection();
//ADD CORS
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program() { }