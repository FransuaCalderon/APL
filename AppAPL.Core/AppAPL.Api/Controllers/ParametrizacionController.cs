using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    public class ParametrizacionController(ILogger<ParametrizacionController> logger, IParametrizacionServicio servicio) : ControllerBase
    {
        [HttpGet("prueba")]
        public async Task<ActionResult> prueba()
        {
            return Ok(new
            {
                mensaje = "prueba ok"
            });
        }
    }
}
