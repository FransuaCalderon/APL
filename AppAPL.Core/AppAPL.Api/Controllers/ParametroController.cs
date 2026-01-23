
using AppAPL.Dto.Parametros;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ParametroController (ILogger<ParametroController> logger, IParametroServicio servicio) : ControllerBase
    {
        [HttpGet("listar")]
        public async Task<ActionResult<List<ParametroDTO>>> ObtenerTodos([FromQuery] string? nombre = null,
         [FromQuery] int? idGrupo = null,
          [FromQuery] int? idEstado = null,
         [FromQuery] DateTime? creadoDesde = null,
         [FromQuery] DateTime? creadoHasta = null,
         [FromQuery] int pageNumber = 1,
         [FromQuery] int pageSize = 50)
        {

            var listaCatalogo = await servicio.ListarAsync(nombre, idGrupo, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);

            return listaCatalogo.ToList();
        }

        [HttpGet("obtener/{idParametro:int}")]
        public async Task<ActionResult<ParametroDTO>> ObtenerPorId(int idParametro)
        {
            var item = await servicio.ObtenerPorIdAsync(idParametro);
            if (item == null)
                return NotFound(new { mensaje = "No se encontró el catalogo" });
            return item;
        }

        [HttpPost("insertar")]
        public async Task<ActionResult> Insertar(CrearActualizarParametroRequest ParametroDTO)
        {
            int idNuevo = await servicio.CrearAsync(ParametroDTO);

            return Ok(new
            {
                mensaje = "Registro insertado correctamente",
                idGenerado = idNuevo
            });
        }

        [HttpPost("actualizar/{idCatalogo:int}")]
        public async Task<ActionResult> Actualizar(CrearActualizarParametroRequest dto, int idParametro)
        {
            /*
            if (idCatalogoTipo is null)
                return BadRequest(new { mensaje = "El campo IdCatalogoTipo es obligatorio." });*/

            await servicio.ActualizarAsync(dto, idParametro);
            return Ok(new { mensaje = "Actualizado correctamente" });
        }

        [HttpPost("eliminar/{idParametro}")]
        public async Task<ActionResult> Eliminar(int idParametro)
        {
            await servicio.EliminarAsync(idParametro);
            return Ok(new { mensaje = "Eliminado correctamente" });
        }
    }
}
