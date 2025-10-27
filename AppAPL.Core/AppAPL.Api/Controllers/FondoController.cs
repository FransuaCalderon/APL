

using AppAPL.Dto.CatalogoTipo;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FondoController(ILogger<FondoController> logger, IFondoServicio servicio) : ControllerBase
    {
        [HttpGet("listar")]
        public async Task<ActionResult<List<FondoDTO>>> ObtenerTodos()
        {
            var listaFondos = await servicio.ListarAsync();

            return listaFondos.ToList();
        }

        [HttpPost("insertar")]
        public async Task<ActionResult> Insertar(CrearActualizarFondoRequest fondo)
        {
            int idNuevo = await servicio.CrearAsync(fondo);

            return Ok(new
            {
                mensaje = "Registro insertado correctamente",
                idGenerado = idNuevo
            });
        }

        // 🔹 PUT: Actualizar
        [HttpPut("actualizar/{idFondo:int}")]
        public async Task<ActionResult> Actualizar(CrearActualizarFondoRequest fondo, int idFondo)
        {
            await servicio.ActualizarAsync(fondo, idFondo);
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
