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
                .WithOrigins("http://127.0.0.1:5501", "http://localhost:5501")
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

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<CinemaDbContext>();

    if (string.Equals(context.Database.ProviderName, "Npgsql.EntityFrameworkCore.PostgreSQL", StringComparison.Ordinal))
    {
        context.Database.ExecuteSqlRaw(@"
            SELECT setval(
                pg_get_serial_sequence('""tickets""', 'TicketId'),
                COALESCE((SELECT MAX(""TicketId"") FROM ""tickets""), 0) + 1,
                false
            );
        ");
    }

    var screenings = context.filmScreenings
        .Include(x => x.Room)
        .ToList();

    var ticketTypes = context.ticketTypes.ToList();
    var tickets = context.tickets.ToList();
    var createdMissingTickets = false;

    foreach (var screening in screenings)
    {
        var roomName = (screening.Room?.RoomName ?? screening.RoomName ?? string.Empty).Trim();
        var roomIsVip = roomName.ToLower().Contains("vip");

        foreach (var ticketType in ticketTypes)
        {
            var ticketName = (ticketType.TicketType ?? string.Empty).Trim();
            var ticketIsVip = ticketName.ToLower().Contains("vip");
            var shouldExist = roomIsVip ? ticketIsVip : !ticketIsVip;

            if (!shouldExist)
            {
                continue;
            }

            var exists = false;

            foreach (var ticket in tickets)
            {
                if (ticket.FilmScreeningId == screening.FilmScreeningId && ticket.TicketTypeId == ticketType.TicketTypeId)
                {
                    exists = true;
                    break;
                }
            }

            if (!exists)
            {
                var newTicket = new Ticket
                {
                    FilmScreeningId = screening.FilmScreeningId,
                    TicketTypeId = ticketType.TicketTypeId,
                };

                context.tickets.Add(newTicket);
                tickets.Add(newTicket);
                createdMissingTickets = true;
            }
        }
    }

    if (createdMissingTickets)
    {
        context.SaveChanges();
    }
}


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