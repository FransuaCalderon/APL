
using AppAPL.Dto.ParametrosTipo;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ParametroTipoController (ILogger<ParametroTipoController> logger, IParametroTipoServicio servicio) : ControllerBase
    {
        // 🔹 GET: Obtener todos
        [HttpGet("listar")]
        public async Task<ActionResult<List<ParametroTipoDTO>>> ObtenerTodos([FromQuery] string? nombre = null,
        [FromQuery] int? idEstado = null,
        [FromQuery] DateTime? creadoDesde = null,
        [FromQuery] DateTime? creadoHasta = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
        {

            var listaParametroTipo = await servicio.ListarAsync(nombre, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);

            logger.LogInformation($"listaCatalogoTipo obtuvo {listaParametroTipo.Count()}");

            return listaParametroTipo.ToList();
        }

        // 🔹 GET: Obtener por ID
        [HttpGet("obtener/{id:int}")]
        public async Task<ActionResult<ParametroTipoDTO>> ObtenerPorId(int id)
        {
            var item = await servicio.ObtenerPorIdAsync(id);
            if (item == null)
                return NotFound(new { mensaje = "No se encontró el catálogo tipo." });
            return item;
        }

        [HttpPost("insertar")]
        public async Task<ActionResult> Insertar(CrearActualizarParametroTipoRequest ParametroTipoDTO)
        {
            int idNuevo = await servicio.CrearAsync(ParametroTipoDTO);

            return Ok(new
            {
                mensaje = "Registro insertado correctamente",
                idGenerado = idNuevo
            });
        }

        // 🔹 PUT: Actualizar
        [HttpPut("actualizar/{idCatalogoTipo:int}")]
        public async Task<ActionResult> Actualizar(CrearActualizarParametroTipoRequest dto, int idCatalogoTipo)
        {
            /*
            if (idCatalogoTipo is null)
                return BadRequest(new { mensaje = "El campo IdCatalogoTipo es obligatorio." });*/

            await servicio.ActualizarAsync(dto, idCatalogoTipo);
            return Ok(new { mensaje = "Actualizado correctamente" });
        }

        // 🔹 DELETE: Eliminar
        [HttpDelete("eliminar/{id}")]
        public async Task<ActionResult> Eliminar(int id)
        {
            await servicio.EliminarAsync(id);
            return Ok(new { mensaje = "Eliminado correctamente" });
        }
    }
}
