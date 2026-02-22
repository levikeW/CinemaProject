using CinemaProject.Model;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Cinema.Dto;
using CinemaProject.Dto;
using Microsoft.AspNetCore.Authorization;

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
        public async Task<ActionResult> Regist(RegistDto dto, bool IsAdmin)
        {
            try
            {
                var role = IsAdmin ? "Admin" : "User";
                await _userModel.Regist(dto, role);
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
        public async Task<ActionResult> LogIn(LoginDto dto)
        {
            try
            {
                var user = await _userModel.ValidateUser(dto);
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
        public async Task<ActionResult<IEnumerable<UserDto>>> ViewProfile(int userId)
        {
            try
            {
                return Ok(await _userModel.ViewProfile(userId));
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
        public async Task<ActionResult> DeleteProfile(int userId)
        {
            try
            {
                await _userModel.DeleteProfile(userId);
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
        public async Task<ActionResult> UpdateProfile(UpdateUserDto dto)
        {
            try
            {
                await _userModel.UpdateProfile(dto);
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
        public async Task<ActionResult> ChangePassword(int userId, string oldPass, string newPass)
        {
            try
            {
                await _userModel.ChangePassword(userId, oldPass, newPass);
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

        [HttpGet("getmydata")]
        [Authorize]
        public async Task<ActionResult<MyDataDto>> WhoAmI()
        {
            return Ok(new MyDataDto
            {
                UserId = User.FindFirstValue(ClaimTypes.NameIdentifier),
                Email = User.Identity?.Name,
                Role = User.FindFirstValue(ClaimTypes.Role)
            });
        }

    }
}
