

using AppAPL.Api.Attributes;
using AppAPL.Dto;
using AppAPL.Dto.CatalogoTipo;
using AppAPL.Dto.Email;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;
using System.Runtime.InteropServices;
using static AppAPL.Api.Attributes.EmailAttribute;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Aprobacion]
    public class FondoController(ILogger<FondoController> logger, IFondoServicio servicio) : ControllerBase
    {
        
        [HttpGet("listar")]
        public async Task<ActionResult<List<FondoDTO>>> ObtenerTodos([FromHeader] int? IdOpcion, [FromHeader] string? IdControlInterfaz,
            [FromHeader] string? IdEvento)
        {
            logger.LogInformation($"IdOpcion: {IdOpcion}, IdControlInterfaz: {IdControlInterfaz}, IdEvento: {IdEvento}");
            var listaFondos = await servicio.ListarAsync();

            return listaFondos.ToList();
        }

        [HttpGet("bandeja-modificacion")]
        public async Task<ActionResult<List<BandejaFondoDTO>>> ObtenerBandejaModificacion()
        {
            
            var listaFondos = await servicio.ObtenerBandejaModificacion();

            return listaFondos.ToList();
        }

        [HttpGet("bandeja-aprobacion/{usuarioAprobador}")]
        public async Task<ActionResult<List<BandejaAprobacionDTO>>> ObtenerBandejaAprobacion(string usuarioAprobador)
        {
           
            var listaFondos = await servicio.ObtenerBandejaAprobacion(usuarioAprobador);

            return listaFondos.ToList();
        }

        [HttpGet("bandeja-aprobacion-id/{idFondo:int}/{idAprobacion:int}")]
        public async Task<ActionResult<BandejaAprobacionDTO>> ObtenerBandejaAprobacionPorId(int idFondo, int idAprobacion)
        {
            
            var item = await servicio.ObtenerBandejaAprobacionPorId(idFondo, idAprobacion);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el fondo con ese idFondo: {idFondo}, idAprobacion: {idAprobacion}" });
            return item;
        }

        [HttpGet("bandeja-inactivacion")]
        public async Task<ActionResult<List<BandejaFondoDTO>>> ObtenerBandejaInactivacion()
        {
            
            var listaFondos = await servicio.ObtenerBandejaInactivacion();

            return listaFondos.ToList();
        }

        [HttpGet("bandeja-inactivacion-id/{idFondo:int}")]
        public async Task<ActionResult<BandejaFondoDTO>> ObtenerBandejaInactivacionPorId(int idFondo)
        {
            
            var listaFondos = await servicio.ObtenerBandejaInactivacion();

            var query = from filtrado in listaFondos
                        where filtrado.IdFondo == idFondo
                        select filtrado;

            var fondo = query.FirstOrDefault();

            return fondo;
        }

        // 🔹 GET: Obtener por ID
        [HttpGet("obtener/{id:int}")]
        public async Task<ActionResult<FondoDTO>> ObtenerPorId(int id)
        {
          
            var item = await servicio.ObtenerPorIdAsync(id);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el fondo con ese id {id}" });
            return item;
        }            

        // 🔹 GET: Obtener por ID
        [HttpGet("bandeja-modificacion-id/{id:int}")]
        public async Task<ActionResult<BandejaFondoDTO>> ObtenerBandejaModificacionPorId(int id)
        {
            
            var item = await servicio.ObtenerBandejaModificacionPorId(id);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el fondo con ese id {id}" });
            return item;
        }

        

        [HttpPost("insertar")]
        [Email("ENTFONDO", TipoProceso.Creacion)]
        public async Task<ActionResult<ControlErroresDTO>> Insertar(CrearFondoRequest fondo)
        {
            var retorno = await servicio.CrearAsync(fondo);

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

        [HttpPost("aprobar-fondo")]
        [Email("ENTFONDO", TipoProceso.Aprobacion)]
        public async Task<ActionResult<ControlErroresDTO>> AprobarFondo(AprobarFondoRequest fondo)
        {
            
            var retorno = await servicio.AprobarFondo(fondo);

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

        [HttpPost("inactivar-fondo")]
        //[Email("ENTFONDO", TipoProceso.Inactivacion)]
        public async Task<ActionResult<ControlErroresDTO>> InactivarFondo(InactivarFondoRequest fondo)
        {

            var retorno = await servicio.InactivarFondo(fondo);

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
        [HttpPut("actualizar/{idFondo:int}")]
        [Email("ENTFONDO", TipoProceso.Modificacion)]

        public async Task<ActionResult<ControlErroresDTO>> Actualizar(ActualizarFondoRequest fondo, int idFondo)
        {
            
            var retorno = await servicio.ActualizarAsync(fondo, idFondo);

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


        /*
        // 🔹 DELETE: Eliminar
        [HttpDelete("eliminar/{id}")]
        //[Email]
        public async Task<ActionResult> Eliminar(int id)
        {
            await servicio.EliminarAsync(id);
            return Ok(new { mensaje = "Eliminado correctamente" });
        }*/
    }
}
