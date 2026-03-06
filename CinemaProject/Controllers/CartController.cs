using Cinema.Dto;
using CinemaProject.Dto;
using CinemaProject.Model;
using CinemaProject.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Query.Internal;
using System.Threading.Tasks;

namespace CinemaProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartController : ControllerBase
    {
        private readonly CartModel _cartModel;
        public CartController(CartModel cartModel)
        {
            _cartModel = cartModel;
        }

        [HttpGet("getcart")]
        public async Task<ActionResult<IEnumerable<CartDto>>> GetCart([FromBody] CartDto dto, [FromQuery] int userId)
        {
            try
            {
                return Ok(await _cartModel.GetCart(dto, userId));
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

        [HttpPut("addtocart")]
        public async Task<ActionResult> AddToCart([FromBody] CartDto dto)
        {
            try
            {
                await _cartModel.AddToCart(dto);
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

        [HttpPost("removefromcart")]
        public async Task<ActionResult> RemoveFromCart([FromQuery] int cartId)
        {
            try
            {
                await _cartModel.RemoveFromCart(cartId);
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

        [HttpPut("updatecart")]
        public async Task<ActionResult> UpdateCart([FromBody] CartDto dto, [FromQuery] int cartId)
        {
            try
            {
                await _cartModel.UpdateCart(dto, cartId);
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

        [HttpPut("modifycart")]
        public async Task<ActionResult> ModifyCart([FromBody] ModifyCartDto dto)
            
        {
            try
            {
                await _cartModel.ModifyCart(dto);
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


        [HttpDelete("clearcart")]
        public async Task<ActionResult> ClearCart([FromQuery] int userId)
        {
            try
            {
                await _cartModel.ClearCart(userId);
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


        /* [HttpDelete("/deletecart")]
         public ActionResult DeleteCart(int cartId)
         {
             try
             {
                 _cartModel.DeleteCart(cartId);
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
        */
    }
}
