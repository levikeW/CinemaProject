using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CinemaProject.Model;
using Cinema.Dto;
using CinemaProject.Dto;

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

        [HttpGet("getallmovies")]
        public async Task<ActionResult<IEnumerable<MovieDto>>> GetAllMovies()
        {
            try
            {
                return Ok(await _cinemaModel.GetAllMovies());
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("getallscreenings")]
        public async Task<ActionResult<IEnumerable<FilmScreeningDto>>> GetAllScreening()
        {
            try
            {
                return Ok(await _cinemaModel.GetAllScreenings());
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("getallrooms")]
        public async Task<ActionResult<IEnumerable<RoomDto>>> GetAllRoom()
        {
            try
            {
                return Ok(await _cinemaModel.GetAllRooms());
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("getalltickettype")]
        public async Task<ActionResult<IEnumerable<TicketTypeDto>>> GetAllTicketType()
        {
            try
            {
                return Ok(await _cinemaModel.GetAllTicketType());
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("getallcateg")]
        public async Task<ActionResult<IEnumerable<CategoriesDto>>> GetAllCateg()
        {
            try
            {
                return Ok(await _cinemaModel.GetAllCategories());
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("searchmoviebytitle")]
        public async Task<ActionResult<IEnumerable<MovieDto>>> SearchMovieByTitle([FromQuery] string item)
        {
            try
            {
                return Ok(await _cinemaModel.SearchMovieByTitle(item));
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("searchmoviebygenre")]
        public async Task<ActionResult<IEnumerable<MovieDto>>> SearchMovieByGenre([FromQuery] string item)
        {
            try
            {
                return Ok(await _cinemaModel.SearchMovieByGenre(item));
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("searchmoviebydirector")]
        public async Task<ActionResult<IEnumerable<MovieDto>>> SearchMovieByDirector([FromQuery] string item)
        {
            try
            {
                return Ok(await _cinemaModel.SearchMovieByDirector(item));
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("getscreeningdetails")]
        public async Task<ActionResult<IEnumerable<FilmScreeningDto>>> GetScreeningDetails([FromQuery] DateTimeOffset time)
        {
            try
            {
                return Ok(await _cinemaModel.GetScreeningDetails(time));
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("getupcomingscreenings")]
        public async Task<ActionResult<List<FilmScreeningDto>>> GetUpcomingScreenings()
        {
            try
            {
                return Ok(await _cinemaModel.GetUpcomingScreenings());
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("ismovienowrunning")]
        public async Task<ActionResult<bool>> IsMovieNowRunning([FromQuery] string movieTitle)
        {
            try
            {
                return Ok(await _cinemaModel.IsMovieNowRunning(movieTitle));
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("getroomcapacity")]
        public async Task<ActionResult<int>> GetRoomCapacity([FromQuery] int roomId)
        {
            try
            {
                return Ok(await _cinemaModel.GetRoomCapacity(roomId));
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("getseats")]
        public async Task<ActionResult<List<SeatDto>>> GetSeats([FromQuery] int roomId, [FromQuery] int screeningId)
        {
            try
            {
                return Ok(await _cinemaModel.GetSeats(roomId, screeningId));
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("isseatavailable")]
        public async Task<ActionResult<bool>> IsSeatAvailable([FromQuery] int seatId, [FromQuery] int screeningId)
        {
            try
            {
                return Ok(await _cinemaModel.IsSeatAvailable(seatId, screeningId));
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("hasfreeseat")]
        public async Task<ActionResult<bool>> HasFreeSeat([FromQuery] int screeningId, [FromQuery] int requiredSeats)
        {
            try
            {
                return Ok(_cinemaModel.HasFreeSeats(screeningId, requiredSeats));
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("getticketsbyscreening")]
        public async Task<ActionResult<IEnumerable<TicketDto>>> GetTicketsByScreening([FromQuery] int screeningId)
        {
            try
            {
                return Ok(await _cinemaModel.GetTicketsByScreening(screeningId));
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpPut("setquantity")]
        public async Task<ActionResult> SetQuantity([FromQuery] int cartId, [FromQuery] int amount)
        {
            try
            {
                await _cinemaModel.SetQuantity(cartId, amount);
                return Ok();
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidDataException e)
            {
                return StatusCode(StatusCodes.Status406NotAcceptable, e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }

        [HttpGet("getimage")]
        public async Task<ActionResult<ImageDto>> GetImage([FromQuery] int movieId)
        {
            try
            {
                return Ok(await _cinemaModel.GetImage(movieId));
            }
            catch (KeyNotFoundException e)
            {
                return NotFound(e.Message);
            }
            catch (InvalidOperationException e)
            {
                return Conflict(e.Message);
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }
        }
    }
}
