
using AppAPL.Dto.CatalogoTipo;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CatalogoTipoController (ICatalogoTipoServicio servicio,
        ILogger<CatalogoTipoController> logger) : ControllerBase
    {

        // 🔹 GET: Obtener todos
        [HttpGet("listar")]
        public async Task<ActionResult<List<CatalogoTipoDTO>>> ObtenerTodos([FromQuery] string? nombre = null,
        [FromQuery] int? idEstado = null,
        [FromQuery] DateTime? creadoDesde = null,
        [FromQuery] DateTime? creadoHasta = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
        {
            logger.LogInformation("esto es una prueba de log");
            var listaCatalogoTipo = await servicio.ListarAsync(nombre, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);
            // Puedes devolver paginación en headers o dentro del cuerpo

            /*
            var result = new
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                Items = datos
            };*/

            return listaCatalogoTipo.ToList();
        }

        // 🔹 GET: Obtener por ID
        [HttpGet("obtener/{id:int}")]
        public async Task<ActionResult<CatalogoTipoDTO>> ObtenerPorId(int id)
        {
            var item = await servicio.ObtenerPorIdAsync(id);
            if (item == null)
                return NotFound(new { mensaje = "No se encontró el catálogo tipo." });
            return item;
        }

        [HttpPost("insertar")]
        public async Task<ActionResult> Insertar(CrearActualizarCatalogoTipoRequest catalogoTipoDTO)
        {
            int idNuevo = await servicio.CrearAsync(catalogoTipoDTO);

            return Ok(new
            {
                mensaje = "Registro insertado correctamente",
                idGenerado = idNuevo
            });
        }

        // 🔹 PUT: Actualizar
        [HttpPut("actualizar/{idCatalogoTipo:int}")]
        public async Task<ActionResult> Actualizar(CrearActualizarCatalogoTipoRequest dto, int idCatalogoTipo)
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
