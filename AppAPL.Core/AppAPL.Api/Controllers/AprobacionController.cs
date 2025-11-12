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
        [HttpGet("consultar-aprobaciones-generales/{entidad}/{identidad:int}/{idTipoProceso?}")]
        [SwaggerOperation(Summary = "Obtiene id tipo proceso, con parámetro extra opcional.")]
        public async Task<ActionResult<List<AprobacionGeneralDTO>>> ObtenerAprobacionesGenerales(string entidad, int identidad,
            [SwaggerParameter(Description = "Parámetro opcional", Required = false)]
            string? idTipoProceso = null)
        {
            var listaAprobaciones = await servicio.ObtenerAprobacionesGenerales(entidad.ToUpper(), identidad, idTipoProceso.ToUpper());

            return listaAprobaciones.ToList();
        }

        [HttpGet("consultar-aprobaciones/{entidad}/{identidad:int}/{idTipoProceso}")]
       
        public async Task<ActionResult<List<AprobacionDTO>>> ObtenerTodos(string entidad, int identidad, string idTipoProceso)
        {
            var listaAprobaciones = await servicio.ObtenerAprobaciones(entidad.ToUpper(), identidad, idTipoProceso.ToUpper());

            return listaAprobaciones.ToList();
        }
    }
}
