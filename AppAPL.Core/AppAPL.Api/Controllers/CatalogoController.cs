using AppAPL.Dto.Catalogo;
using AppAPL.Dto.Opciones;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CatalogoController (ICatalogoServicio servicio, ILogger<CatalogoController> logger) : ControllerBase
    {
        [HttpGet("listar")]
        public async Task<ActionResult<List<CatalogoDTO>>> ObtenerTodos([FromQuery] string? nombre = null,
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

        [HttpGet("obtener/{id:int}")]
        public async Task<ActionResult<CatalogoDTO>> ObtenerPorId(int id)
        {
            var item = await servicio.ObtenerPorIdAsync(id);
            if (item == null)
                return NotFound(new { mensaje = "No se encontró el catalogo" });
            return item;
        }

        [HttpPost("insertar")]
        public async Task<ActionResult> Insertar(CrearActualizarCatalogoRequest catalogoDTO)
        {
            int idNuevo = await servicio.CrearAsync(catalogoDTO);

            return Ok(new
            {
                mensaje = "Registro insertado correctamente",
                idGenerado = idNuevo
            });
        }

        [HttpPut("actualizar/{idCatalogo:int}")]
        public async Task<ActionResult> Actualizar(CrearActualizarCatalogoRequest dto, int idCatalogo)
        {
            /*
            if (idCatalogoTipo is null)
                return BadRequest(new { mensaje = "El campo IdCatalogoTipo es obligatorio." });*/

            await servicio.ActualizarAsync(dto, idCatalogo);
            return Ok(new { mensaje = "Actualizado correctamente" });
        }

        [HttpDelete("eliminar/{id}")]
        public async Task<ActionResult> Eliminar(int id)
        {
            await servicio.EliminarAsync(id);
            return Ok(new { mensaje = "Eliminado correctamente" });
        }
    }
}
