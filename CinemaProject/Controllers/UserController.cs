using CinemaProject.Model;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Cinema.Dto;
using CinemaProject.Dto;

namespace CinemaProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserModel _userModel;

        public UserController(UserModel usermodel)
        {
            _userModel = usermodel;
        }

        [HttpPost("/Regist")]
        public ActionResult Regist(string email, string password, bool IsAdmin)
        {
            try
            {
                var role = IsAdmin ? "Admin" : "User";
                _userModel.Regist(email, password, role);
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

        [HttpPost("/login")]
        public async Task<ActionResult> LogIn(string email, string password)
        {
            try
            {
                var user = _userModel.ValidateUser(email, password);
                if (user == null)
                {
                    return null;
                }

                List<Claim> claims = new()
                {
                new Claim( ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim( ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
                };
                var id = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                var principal = new ClaimsPrincipal(id);
                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
                return Ok(new { role = user.Role });
            }
            catch (Exception e)
            {
                return BadRequest();
            }
        }

        [HttpPost("/logout")]
        public async Task<ActionResult> LogOut()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok();
        }

        [HttpGet("/viewprofile")]
        public ActionResult<IEnumerable<UserDto>> ViewProfile(int userId)
        {
            try
            {
                return Ok(_userModel.ViewProfile(userId));
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

        [HttpDelete("/deleteprofile")]
        public ActionResult DeleteProfile(int userId)
        {
            try
            {
                _userModel.DeleteProfile(userId);
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

        [HttpPut("/updateprofile")]
        public ActionResult UpdateProfile(int userId, UpdateUserDto dto)
        {
            try
            {
                _userModel.UpdateProfile(userId, dto);
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

        [HttpPut("/changepass")]
        public ActionResult ChangePassword(int userId, string oldPass, string newPass)
        {
            try
            {
                _userModel.ChangePassword(userId, oldPass, newPass);
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
