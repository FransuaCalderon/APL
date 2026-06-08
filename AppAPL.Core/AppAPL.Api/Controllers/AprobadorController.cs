using AppAPL.Dto.Aprobador;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;


namespace AppAPL.Api.Controllers
{
        [ApiController]
    [Route("api/[controller]")]
    public class AprobadorController(ILogger<AprobadorController> logger, IAprobadorServicio servicio) : ControllerBase
    {
        [HttpGet("listar")]
        public async Task<ActionResult<List<AprobadorDTO>>> ObtenerTodos()
        {
            var lista = await servicio.ListarAsync();
            return lista.ToList();
        }

        [HttpGet("obtener/{idAprobador:long}")]
        public async Task<ActionResult<AprobadorDTO>> ObtenerPorId(long idAprobador)
        {
            var item = await servicio.ObtenerPorIdAsync(idAprobador);
            if (item == null)
                return NotFound(new { mensaje = "No se encontró el aprobador" });
            return item;
        }

        [HttpPost("insertar")]
        public async Task<ActionResult> Insertar(CrearAprobadorRequest dto)
        {
            long idNuevo = await servicio.CrearAsync(dto);

            return Ok(new
            {
                mensaje = "Registro insertado correctamente",
                idGenerado = idNuevo
            });
        }

        [HttpPost("actualizar")]
        public async Task<ActionResult> Actualizar(ActualizarAprobadorRequest dto)
        {
            await servicio.ActualizarAsync(dto);
            return Ok(new { mensaje = "Actualizado correctamente" });
        }

        [HttpPost("eliminar")]
        public async Task<ActionResult> Eliminar(EliminarAprobadorRequest dto)
        {
            await servicio.EliminarAsync(dto);
            return Ok(new { mensaje = "Eliminado correctamente" });
        }
    }
}