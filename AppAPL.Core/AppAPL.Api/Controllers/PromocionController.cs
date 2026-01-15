using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class PromocionController(ILogger<PromocionController> logger, IPromocionServicio servicio) : ControllerBase
    {
        [HttpGet("prueba")]
        public async Task<ActionResult> prueba()
        {
            return Ok(new { mensaje = "prueba"});
        }
    }
}
