using AppAPL.Dto.CatalogoTipo;
using AppAPL.Dto.Opciones;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OpcionesController(IOpcionServicio servicio, ILogger<OpcionesController> logger) : ControllerBase
    {
        [HttpGet("listar")]
        public async Task<ActionResult<List<OpcionDTO>>> ObtenerTodos([FromQuery] string? nombre = null,
         [FromQuery] int? idGrupo = null,
          [FromQuery] int? idEstado = null,
         [FromQuery] DateTime? creadoDesde = null,
         [FromQuery] DateTime? creadoHasta = null,
         [FromQuery] int pageNumber = 1,
         [FromQuery] int pageSize = 50)
        {
           
            var listaOpciones = await servicio.ListarAsync(nombre, idGrupo, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);

            return listaOpciones.ToList();
        }

        [HttpGet("listarPorRol/{usuarioRol}")]
        public async Task<ActionResult<GrupoOpcionDTO>> listarPorRol(string usuarioRol)
        {
            var listaOpcionesPorRol = await servicio.ListarOpcionesPorRolAsync(usuarioRol);

            var grupos = (from filtrado in listaOpcionesPorRol
                          select filtrado.IdCatalogo)
             .Distinct();

            var grupoOpciones = new GrupoOpcionDTO()
            {
                Grupos = grupos,
                Opciones = listaOpcionesPorRol
            };

            return grupoOpciones;
        }

        [HttpGet("obtener/{id:int}")]
        public async Task<ActionResult<OpcionDTO>> ObtenerPorId(int id)
        {
            var item = await servicio.ObtenerPorIdAsync(id);
            if (item == null)
                return NotFound(new { mensaje = "No se encontró la opcion" });
            return item;
        }

        [HttpPost("insertar")]
        public async Task<ActionResult> Insertar(CrearActualizarOpcionRequest opcionesDTO)
        {
            int idNuevo = await servicio.CrearAsync(opcionesDTO);

            return Ok(new
            {
                mensaje = "Registro insertado correctamente",
                idGenerado = idNuevo
            });
        }

        [HttpPut("actualizar/{idOpcion:int}")]
        public async Task<ActionResult> Actualizar(CrearActualizarOpcionRequest dto, int idOpcion)
        {
            /*
            if (idCatalogoTipo is null)
                return BadRequest(new { mensaje = "El campo IdCatalogoTipo es obligatorio." });*/

            await servicio.ActualizarAsync(dto, idOpcion);
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