using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CinemaProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class Payment_ReservationController : ControllerBase
    {
        private readonly Payment_ReservationModel _paymentReservationModel;
        public Payment_ReservationController(Payment_ReservationModel paymentReservationModel)
        {
            _paymentReservationModel = paymentReservationModel;
        }

        [HttpPost("/createreservation")]
        public ActionResult CreateReservation(int cartId)
        {
            try
            {
                _paymentReservationModel.CreateReservation(cartId);
                return Ok();
            }
            catch (InvalidOperationException e)
            {
                return BadRequest(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpDelete("/cancelreservation")]
        public ActionResult CancelReservaton(int reservationId)
        {
            try
            {
                _paymentReservationModel.CancelReservation(reservationId);
                return Ok();
            }
            catch (InvalidOperationException e)
            {
                return BadRequest(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPut("/payreservation")]
        public ActionResult PayReservation(int reservationId)
        {
            try
            {
                _paymentReservationModel.PayReservation(reservationId);
                return Ok();
            }
            catch (InvalidOperationException e)
            {
                return BadRequest(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("/getreceipt")]
        public ActionResult<ReceiptDto> GetReceipt(int reservationId)
        {
            try
            {
                return Ok(_paymentReservationModel.GetReceipt(reservationId));
            }
            catch (InvalidOperationException e)
            {
                return BadRequest(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("/getconfirmation")]
        public ActionResult<ConfirmationDto> GetConfirmation(int reservationId)
        {
            try
            {
                return Ok(_paymentReservationModel.GetConfirmation(reservationId));
            }
            catch (InvalidOperationException e)
            {
                return BadRequest(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("/viewupcomingreservation")]
        public ActionResult<List<PaymentReservationDto>> ViewUpcomingReservation(int userId)
        {
            try
            {
                return Ok(_paymentReservationModel.ViewUpcomigReservations(userId));
            }
            catch (InvalidOperationException e)
            {
                return BadRequest(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("/viewpastreservation")]
        public ActionResult<List<PaymentReservationDto>> ViewPastReservations(int userId)
        {
            try
            {
                return Ok(_paymentReservationModel.ViewPastReservations(userId));
            }
            catch (InvalidOperationException e)
            {
                return BadRequest(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }
    }
}
