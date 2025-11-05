

using AppAPL.Api.Attributes;
using AppAPL.Dto.CatalogoTipo;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Aprobacion]
    public class FondoController(ILogger<FondoController> logger, IFondoServicio servicio) : ControllerBase
    {
        [HttpGet("listar")]
        public async Task<ActionResult<List<FondoDTO>>> ObtenerTodos()
        {
            var listaFondos = await servicio.ListarAsync();

            return listaFondos.ToList();
        }

        [HttpPost("insertar")]
        [Aprobacion]
        //[Email]
        public async Task<ActionResult> Insertar(CrearFondoRequest fondo)
        {
            await servicio.CrearAsync(fondo);

            return Ok(new
            {
                mensaje = "Registro insertado correctamente"
            });
        }

        // 🔹 PUT: Actualizar
        [HttpPut("actualizar/{idFondo:int}")]
        [Aprobacion]
        //[Email]
        public async Task<ActionResult> Actualizar(ActualizarFondoRequest fondo, int idFondo)
        {
            await servicio.ActualizarAsync(fondo, idFondo);
            return Ok(new { mensaje = "Actualizado correctamente" });
        }


        // 🔹 DELETE: Eliminar
        [HttpDelete("eliminar/{id}")]
        [Aprobacion]
        //[Email]
        public async Task<ActionResult> Eliminar(int id)
        {
            await servicio.EliminarAsync(id);
            return Ok(new { mensaje = "Eliminado correctamente" });
        }
    }
}
