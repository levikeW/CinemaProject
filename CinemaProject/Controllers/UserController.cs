using CinemaProject.Model;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CinemaProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserModel _userModel;

        public UserController(UserModel umodel)
        {
            _userModel = umodel;
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
    }
}
