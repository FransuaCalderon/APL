using AppAPL.Dto.Log;
using AppAPL.Dto.Promocion;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditoriaController (ILogger<AuditoriaController> logger, ILogServicio servicio) : ControllerBase
    {
        [HttpGet("consultar-logs-general/{entidad}/{identidad:int}")]
        public async Task<ActionResult<List<LogDTO>>> ConsultarPromocion(string entidad, int identidad)
        {
            var listaLog = await servicio.ConsultarLogGeneral(entidad.ToUpper(), identidad);

            return listaLog.ToList();
        }
    }
}
