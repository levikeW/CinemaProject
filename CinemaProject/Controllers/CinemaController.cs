using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CinemaProject.Model;
using Cinema.Dto;

namespace CinemaProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CinemaController : ControllerBase
    {
        private readonly CinemaModel _cinemaModel;
        public CinemaController(CinemaModel cinemaModel)
        {
            _cinemaModel = cinemaModel;
        }

        [HttpGet("/getallmovies")]
        public async Task<ActionResult<IEnumerable<MovieDto>>> GetAllMovies()
        {
            try
            {
                return Ok(await _cinemaModel.GetAllMovies());
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

        [HttpGet("/getallscreenings")]
        public async Task<ActionResult<IEnumerable<FilmScreeningDto>>> GetAllScreening()
        {
            try
            {
                return Ok(await _cinemaModel.GetAllScreenings());
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

        [HttpGet("/getallticket")]
        public async Task<ActionResult<IEnumerable<TicketDto>>> GetAllTicket()
        {
            try
            {
                return Ok(await _cinemaModel.GetAllTickets());
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

        [HttpGet("/searchmoviebytitle")]
        public async Task<ActionResult<IEnumerable<MovieDto>>> SearchMovieByTitle(string item)
        {
            try
            {
                return Ok(await _cinemaModel.SearchMovieByTitle(item));
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

        [HttpGet("/searchmoviebygenre")]
        public async Task<ActionResult<IEnumerable<MovieDto>>> SearchMovieByGenre(string item)
        {
            try
            {
                return Ok(await _cinemaModel.SearchMovieByGenre(item));
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

        [HttpGet("/searchmoviebydirector")]
        public async Task<ActionResult<IEnumerable<MovieDto>>> SearchMovieByDirector(string item)
        {
            try
            {
                return Ok(await _cinemaModel.SearchMovieByDirector(item));
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

        [HttpGet("/getscreeningdetails")]
        public async Task<ActionResult<IEnumerable<FilmScreeningDto>>> GetScreeningDetails(DateTime time)
        {
            try
            {
                return Ok(await _cinemaModel.GetScreeningDetails(time));
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

        [HttpGet("/getupcomingscreenings")]
        public async Task<ActionResult<List<FilmScreeningDto>>> GetUpcomingScreenings()
        {
            try
            {
                return Ok(await _cinemaModel.GetUpcomingScreenings());
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

        [HttpGet("/ismovienowrunning")]
        public async Task<ActionResult<bool>> IsMovieNowRunning(string movieTitle)
        {
            try
            {
                return Ok(await _cinemaModel.IsMovieNowRunning(movieTitle));
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

        [HttpGet("/getroomcapacity")]
        public async Task<ActionResult<int>> GetRoomCapacity(int roomId)
        {
            try
            {
                return Ok(await _cinemaModel.GetRoomCapacity(roomId));
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

        [HttpGet("/getseats")]
        public async Task<ActionResult<List<SeatDto>>> GetSeats(int roomId, int screeningId)
        {
            try
            {
                return Ok(await _cinemaModel.GetSeats(roomId, screeningId));
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

        [HttpGet("/isseatavailable")]
        public async Task<ActionResult<bool>> IsSeatAvailable(int seatId, int screeningId)
        {
            try
            {
                return Ok(await _cinemaModel.IsSeatAvailable(seatId, screeningId));
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

        [HttpGet("/hasfreeseat")]
        public async Task<ActionResult<bool>> HasFreeSeat(int screeningId, int requiredSeats)
        {
            try
            {
                return Ok(await _cinemaModel.HasFreeSeats(screeningId, requiredSeats));
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

        [HttpGet("/selecttickettype")]
        public async Task<ActionResult<TicketDto>> SelectTicketType(int screeningId)
        {
            try
            {
                return Ok(await _cinemaModel.SelectTicketType(screeningId));
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

        [HttpPut("/setquantity")]
        public async Task<ActionResult> SetQuantity(int cartId, int amount)
        {
            try
            {
                await _cinemaModel.SetQuantity(cartId, amount);
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

        [HttpGet("/getimage")]
        public async Task<ActionResult<ImageDto>> GetImage(int movieId)
        {
            try
            {
                return Ok(await _cinemaModel.GetImage(movieId));
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
