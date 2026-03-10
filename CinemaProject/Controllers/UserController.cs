using CinemaProject.Model;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Cinema.Dto;
using CinemaProject.Dto;
using Microsoft.AspNetCore.Authorization;
using System.Diagnostics;

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

        [AllowAnonymous]
        [HttpPost("Regist")]
        public async Task<ActionResult> Regist([FromBody] RegistDto dto, [FromQuery] bool IsAdmin)
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

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult> LogIn([FromBody] LoginDto dto)
        {
            try
            {
                var user = await _userModel.ValidateUser(dto);

                Debug.WriteLine("Email: " + dto.email);
                Debug.WriteLine("Password: " + dto.password);
                Debug.WriteLine("User found: " + (user != null));
                if (user == null)
                {
                    return Unauthorized("Hibás email vagy jelszó.");
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
            catch
            {
                return BadRequest();
            }
        }

        [HttpPost("logout")]
        public async Task<ActionResult> LogOut()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok();
        }

        [Authorize(Roles = "User, Admin")]
        [HttpGet("viewprofile")]
        public async Task<ActionResult<IEnumerable<UserDto>>> ViewProfile([FromQuery] int userId)
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

        [Authorize(Roles = "User, Admin")]
        [HttpDelete("deleteprofile")]
        public async Task<ActionResult> DeleteProfile([FromQuery] int userId)
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

        [Authorize(Roles = "User, Admin")]
        [HttpPut("updateprofile")]
        public async Task<ActionResult> UpdateProfile([FromBody] UpdateUserDto dto)
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

        [Authorize(Roles = "User, Admin")]
        [HttpPut("changepass")]
        public async Task<ActionResult> ChangePassword([FromQuery] int userId, [FromQuery] string oldPass, [FromQuery] string newPass)
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
                UserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty,
                Email = User.Identity?.Name ?? string.Empty,
                Role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty
            });
        }

    }
}
