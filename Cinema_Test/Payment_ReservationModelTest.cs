using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Model;
using CinemaProject.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace Cinema_Test
{
    public class Payment_ReservationModelTest
    {
        private readonly Payment_ReservationModel _reservationModel;
        private readonly CinemaDbContext _context;

        public Payment_ReservationModelTest()
        {
            _context = DbContextFactory.Create();
            DbSeeder.Seed(_context);
            _reservationModel = new Payment_ReservationModel(_context);
        }

        // CREATE RESERVATION
        [Fact]
        public async Task CreateReservation()
        {
            var ticket = _context.tickets.Include(x => x.TicketType).First(x => x.FilmScreeningId != null);

            var cart = new Cart
            {
                UserId = _context.users.First().UserId,
                FilmScreeningId = ticket.FilmScreeningId!.Value,
                TicketId = ticket.TicketId,
                Amount = 1,
                TotalPrice = ticket.TicketType.TicketPrice
            };

            _context.carts.Add(cart);
            _context.SaveChanges();

            await _reservationModel.CreateReservation(cart.CartId);

            Assert.True(_context.paymentReservations.Any(x => x.CartId == cart.CartId));
        }

        // CANCEL RESERVATION
        [Fact]
        public async Task CancelReservation()
        {
            var reservation = _context.paymentReservations.First(r => !r.IsPaid);

            await _reservationModel.CancelReservation(reservation.PaymentReservationId);

            Assert.False(_context.paymentReservations.Any(r => r.PaymentReservationId == reservation.PaymentReservationId));
        }

        [Fact]
        public async Task CancelReservation_Wrong_NotFound()
        {
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(async () =>
                await _reservationModel.CancelReservation(99999));

            Assert.Equal("Reservation not found", ex.Message);
        }

        [Fact]
        public async Task CancelReservation_Wrong_AlreadyPaid()
        {
            var reservation = _context.paymentReservations.First();
            reservation.IsPaid = true;
            await _context.SaveChangesAsync();

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _reservationModel.CancelReservation(reservation.PaymentReservationId));

            Assert.Equal("Cannot cancel a paid reservation", ex.Message);
        }

        // PAY RESERVATION
        [Fact]
        public async Task PayReservation()
        {
            var reservation = _context.paymentReservations.First(r => !r.IsPaid);

            var result = await _reservationModel.PayReservation(reservation.PaymentReservationId);

            var updated = _context.paymentReservations.First(r => r.PaymentReservationId == reservation.PaymentReservationId);
            Assert.True(updated.IsPaid);
            Assert.NotNull(result);
            Assert.IsType<ReceiptDto>(result);
        }

        [Fact]
        public async Task PayReservation_Wrong()
        {
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(async () =>
                await _reservationModel.PayReservation(99999));

            Assert.Equal("Reservation not found", ex.Message);
        }

        // GET RECEIPT / CONFIRMATION
        [Fact]
        public async Task GetReceipt()
        {
            var reservation = _context.paymentReservations.First();

            var result = await _reservationModel.GetReceipt(reservation.PaymentReservationId);

            Assert.NotNull(result);
            Assert.Equal(reservation.PaymentReservationId, result.PaymentReservationId);
        }

        [Fact]
        public async Task GetConfirmation()
        {
            var reservation = _context.paymentReservations.First();

            var result = await _reservationModel.GetConfirmation(reservation.PaymentReservationId);

            Assert.NotNull(result);
            Assert.Equal(reservation.PaymentReservationId, result.ReservationId);
        }

        // VIEW RESERVATIONS (UPCOMING, PAST)
        [Fact]
        public async Task ViewUpcomingReservations()
        {
            var userId = 1;
            var result = await _reservationModel.ViewUpcomigReservations(userId);

            Assert.IsType<List<PaymentReservationDto>>(result);
        }

        [Fact]
        public async Task ViewPastReservations()
        {
            var userId = 1;
            var result = await _reservationModel.ViewPastReservations(userId);

            Assert.IsType<List<PaymentReservationDto>>(result);
        }

        [Fact]
        public async Task ViewUpcomingReservations_Empty_WrongUser()
        {
            var result = await _reservationModel.ViewUpcomigReservations(8888);

            Assert.Empty(result);
        }
    }
}