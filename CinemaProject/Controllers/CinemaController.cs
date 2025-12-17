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
        public ActionResult<IEnumerable<MovieDto>> GetAllMovies()
        {
            try
            {
                return Ok(_cinemaModel.GetAllMovies());
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
        public ActionResult<IEnumerable<FilmScreeningDto>> GetAllScreening()
        {
            try
            {
                return Ok(_cinemaModel.GetAllScreenings());
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
        public ActionResult<IEnumerable<TicketDto>> GetAllTicket()
        {
            try
            {
                return Ok(_cinemaModel.GetAllTickets());
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
        public ActionResult<IEnumerable<MovieDto>> SearchMovieByTitle(string item)
        {
            try
            {
                return Ok(_cinemaModel.SearchMovieByTitle(item));
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
        public ActionResult<IEnumerable<MovieDto>> SearchMovieByGenre(string item)
        {
            try
            {
                return Ok(_cinemaModel.SearchMovieByGenre(item));
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
        public ActionResult<IEnumerable<MovieDto>> SearchMovieByDirector(string item)
        {
            try
            {
                return Ok(_cinemaModel.SearchMovieByDirector(item));
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
        public ActionResult<IEnumerable<FilmScreeningDto>> GetScreeningDetails(DateTime time)
        {
            try
            {
                return Ok(_cinemaModel.GetScreeningDetails(time));
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
        public ActionResult<List<FilmScreeningDto>> GetUpcomingScreenings()
        {
            try
            {
                return Ok(_cinemaModel.GetUpcomingScreenings());
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
        public ActionResult<bool> IsMovieNowRunning(string movieTitle)
        {
            try
            {
                return Ok(_cinemaModel.IsMovieNowRunning(movieTitle));
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
        public ActionResult<int> GetRoomCapacity(int roomId)
        {
            try
            {
                return Ok(_cinemaModel.GetRoomCapacity(roomId));
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
        public ActionResult<List<SeatDto>> GetSeats(int roomId, int screeningId)
        {
            try
            {
                return Ok(_cinemaModel.GetSeats(roomId, screeningId));
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
        public ActionResult<bool> IsSeatAvailable(int seatId, int screeningId)
        {
            try
            {
                return Ok(_cinemaModel.IsSeatAvailable(seatId, screeningId));
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
        public ActionResult<bool> HasFreeSeat(int screeningId, int requiredSeats)
        {
            try
            {
                return Ok(_cinemaModel.HasFreeSeats(screeningId, requiredSeats));
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
        public ActionResult<TicketDto> SelectTicketType(int screeningId)
        {
            try
            {
                return Ok(_cinemaModel.SelectTicketType(screeningId));
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
        public ActionResult SetQuantity(int cartId, int amount)
        {
            try
            {
                _cinemaModel.SetQuantity(cartId, amount);
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
        public ActionResult<ImageDto> GetImage(int movieId)
        {
            try
            {
                return Ok(_cinemaModel.GetImage(movieId));
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
