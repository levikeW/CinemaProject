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
        public async Task<ActionResult> CreateReservation([FromQuery] int cartId)
        {
            try
            {
                await _paymentReservationModel.CreateReservation(cartId);
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
        public async Task<ActionResult> CancelReservaton([FromQuery] int reservationId)
        {
            try
            {
                await _paymentReservationModel.CancelReservation(reservationId);
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
        public async Task<ActionResult> PayReservation([FromQuery] int reservationId)
        {
            try
            {
                await _paymentReservationModel.PayReservation(reservationId);
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
        public async Task<ActionResult<ReceiptDto>> GetReceipt( [FromQuery] int reservationId)
        {
            try
            {
                return Ok(await _paymentReservationModel.GetReceipt(reservationId));
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
        public async Task<ActionResult<ConfirmationDto>> GetConfirmation([FromQuery] int reservationId)
        {
            try
            {
                return Ok(await _paymentReservationModel.GetConfirmation(reservationId));
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
        public async Task<ActionResult<List<PaymentReservationDto>>> ViewUpcomingReservation([FromQuery] int userId)
        {
            try
            {
                return Ok(await _paymentReservationModel.ViewUpcomigReservations(userId));
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
        public async Task<ActionResult<List<PaymentReservationDto>>> ViewPastReservations([FromQuery] int userId)
        {
            try
            {
                return Ok(await _paymentReservationModel.ViewPastReservations(userId));
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
