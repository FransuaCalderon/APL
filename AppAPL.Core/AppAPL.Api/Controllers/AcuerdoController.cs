using AppAPL.Api.Attributes;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;
using static System.Net.Mime.MediaTypeNames;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class AcuerdoController(ILogger<AcuerdoController> logger, IAcuerdoServicio servicio) : ControllerBase
    {
        [HttpGet("consultar-acuerdo-fondo/{idFondo:int}")]
        public async Task<ActionResult<List<ConsultarAcuerdoFondoDTO>>> ConsultarAcuerdoFondo(int idFondo)
        {
            var listaAcuerdoFondos = await servicio.ConsultarAcuerdoFondo(idFondo);

            return listaAcuerdoFondos.ToList();
        }

        [HttpGet("obtener/{id:int}")]
        public async Task<ActionResult<AcuerdoDTO>> ObtenerPorId(int id)
        {

            var item = await servicio.ObtenerPorIdAsync(id);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el acuerdo con ese id {id}" });
            return item;
        }


        [HttpPost("insertar")]
        [Email("ENTACUERDO", TipoProceso.Creacion)]
        public async Task<ActionResult<ControlErroresDTO>> Insertar(CrearActualizarAcuerdoDTO acuerdo)
        {
            var retorno = await servicio.CrearAsync(acuerdo);

            if (retorno.codigoRetorno == 0)
            {
                logger.LogInformation(retorno.mensaje);
                return retorno;
            }
            else
            {

                logger.LogError(retorno.mensaje);
                return BadRequest(retorno);
            }
        }

        [HttpPost("aprobar-acuerdo")]
        [Email("ENTACUERDO", TipoProceso.Aprobacion)]
        public async Task<ActionResult<ControlErroresDTO>> AprobarAcuerdo( AprobarAcuerdoDTO acuerdo)
        {

            var retorno = await servicio.AprobarAcuerdo(acuerdo);

            if (retorno.codigoRetorno == 0)
            {
                logger.LogInformation(retorno.mensaje);
                return retorno;
            }
            else
            {

                logger.LogError(retorno.mensaje);
                return BadRequest(retorno);
            }
        }

        [HttpPost("inactivar-acuerdo")]
        [Email("ENTACUERDO", TipoProceso.Inactivacion)]
        public async Task<ActionResult<ControlErroresDTO>> InactivarAcuerdo(InactivarAcuerdoDTO acuerdo)
        {

            var retorno = await servicio.InactivarAcuerdo(acuerdo);

            if (retorno.codigoRetorno == 0)
            {
                logger.LogInformation(retorno.mensaje);
                return retorno;
            }
            else
            {

                logger.LogError(retorno.mensaje);
                return BadRequest(retorno);
            }
        }

        // 🔹 PUT: Actualizar
        [HttpPut("actualizar/{idAcuerdo:int}")]
        [Email("ENTACUERDO", TipoProceso.Modificacion)]

        public async Task<ActionResult<ControlErroresDTO>> Actualizar( CrearActualizarAcuerdoDTO acuerdo, int idAcuerdo)
        {

            var retorno = await servicio.ActualizarAsync(acuerdo, idAcuerdo);

            if (retorno.codigoRetorno == 0)
            {
                //logger.LogInformation(retorno.mensaje);
                return retorno;
            }
            else
            {

                //logger.LogError(retorno.mensaje);
                return BadRequest(retorno);
            }
        }

    }
}
