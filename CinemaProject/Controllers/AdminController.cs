using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Model;
using CinemaProject.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace CinemaProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly AdminModel _adminModel;

        public AdminController(AdminModel adminModel)
        {
            _adminModel = adminModel;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("/getalluser")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUser()
        {
            try
            {
                return Ok(await _adminModel.GetAllUsers());
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

        [Authorize(Roles = "Admin")]
        [HttpGet("/getallreservation")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllReservation()
        {
            try
            {
                return Ok(await _adminModel.GetAllReservations());
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

        [Authorize(Roles = "Admin")]
        [HttpGet("/searchuser")]
        public async Task<ActionResult<IEnumerable<UserDto>>> SearchUser(string item)
        {
            try
            {
                return Ok(await _adminModel.SearchUser(item));
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

        [Authorize(Roles = "Admin")]
        [HttpPost("/newmovie")]
        public async Task<ActionResult> NewMovie(NewMovieDto dto)
        {
            try
            {
                await _adminModel.NewMovie(dto);
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

        [Authorize(Roles = "Admin")]
        [HttpPost("/newscreening")]
        public async Task<ActionResult> NewScreening(NewScreeningDto dto)
        {
            try
            {
                await _adminModel.NewScreening(dto);
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

        [Authorize(Roles = "Admin")]
        [HttpPut("/modifymovie")]
        public async Task<ActionResult> ModifyMovie(MovieDto dto, int movieId)
        {
            try
            {
                await _adminModel.ModifyMovie(dto, movieId);
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

        [Authorize(Roles = "Admin")]
        [HttpPut("/modifyfilmscreening")]
        public async Task<ActionResult> ModifyFilmScreening(FilmScreeningDto dto, int screeningId)
        {
            try
            {
                await _adminModel.ModifyFilmScreening(dto, screeningId);
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

        [Authorize(Roles = "Admin")]
        [HttpPut("/modifyreservation")]
        public async Task<ActionResult> ModifyReservation(PaymentReservationDto dto, int reservationId)
        {
            try
            {
                await _adminModel.ModifyReservation(dto, reservationId);
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

        [Authorize(Roles = "Admin")]
        [HttpPut("/modifyticket")]
        public async Task<ActionResult> ModifyTicket(TicketDto dto, int ticketId)
        {
            try
            {
                await _adminModel.ModifyTicket(dto, ticketId);
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

        [Authorize(Roles = "Admin")]
        [HttpDelete("/deleteuser")]
        public async Task<ActionResult> DeleteUser(int userId)
        {
            try
            {
                await _adminModel.DeleteUser(userId);
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

        [Authorize(Roles = "Admin")]
        [HttpDelete("/deletemovie")]
        public async Task<ActionResult> DeleteMovie(int movieId)
        {
            try
            {
                await _adminModel.DeleteMovie(movieId);
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

        [Authorize(Roles = "Admin")]
        [HttpDelete("/deletescreening")]
        public async Task<ActionResult> DeleteScreening(int screeningId)
        {
            try
            {
                await _adminModel.DeleteScreening(screeningId);
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

        [Authorize(Roles = "Admin")]
        [HttpDelete("/deletereservation")]
        public async Task<ActionResult> DeleteReservation(int reservationId)
        {
            try
            {
                await _adminModel.DeleteReservation(reservationId);
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

        [Authorize(Roles = "Admin")]
        [HttpPost("/uploadimage")]
        public async Task<ActionResult> UploadImage(ImageDto dto)
        {
            try
            {
                await _adminModel.UploadImage(dto);
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

        [Authorize(Roles = "Admin")]
        [HttpDelete("/deleteimage")]
        public async Task<ActionResult> DeleteImage(int imageId)
        {
            try
            {
                await _adminModel.DeleteImage(imageId);
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

        [HttpPut("/changerole")]
        public async Task<ActionResult> ChangeRole(int userId)
        {
            try
            {
                await _adminModel.ChangeRole(userId);
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
    }
}
