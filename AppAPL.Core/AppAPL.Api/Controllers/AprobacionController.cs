using AppAPL.Dto.Aprobacion;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AprobacionController (ILogger<AprobacionController> logger, IAprobacionServicio servicio) : ControllerBase
    {
        [HttpGet("listar/{entidad}/{identidad:int}/{idTipoProceso?}")]
        [SwaggerOperation(Summary = "Obtiene id tipo proceso, con parámetro extra opcional.")]
        public async Task<ActionResult<List<AprobacionDTO>>> ObtenerTodos(string entidad, int identidad,
            [SwaggerParameter(Description = "Parámetro opcional", Required = false)]
            string? idTipoProceso = null)
        {
            var listaAprobaciones = await servicio.ObtenerAprobacionesAsync(entidad, identidad, idTipoProceso);

            return listaAprobaciones.ToList();
        }
    }
}
