

using AppAPL.Api.Attributes;
using AppAPL.Dto;
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

        // 🔹 GET: Obtener por ID
        [HttpGet("obtener/{id:int}")]
        public async Task<ActionResult<FondoDTO>> ObtenerPorId(int id)
        {
            var item = await servicio.ObtenerPorIdAsync(id);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el fondo con ese id {id}" });
            return item;
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
        public async Task<ActionResult<ControlErroresDTO>> Actualizar(ActualizarFondoRequest fondo, int idFondo)
        {
            var retorno = await servicio.ActualizarAsync(fondo, idFondo);

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


        /*
        // 🔹 DELETE: Eliminar
        [HttpDelete("eliminar/{id}")]
        //[Aprobacion]
        //[Email]
        public async Task<ActionResult> Eliminar(int id)
        {
            await servicio.EliminarAsync(id);
            return Ok(new { mensaje = "Eliminado correctamente" });
        }*/
    }
}
