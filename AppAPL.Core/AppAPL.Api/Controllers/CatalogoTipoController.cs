using apiOracle.DTOs;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AppAPL.Api.Controllers
{
    public class CatalogoTipoController (ICatalogoTipoServicio servicio,
        ILogger<CatalogoTipoController> logger) : ControllerBase
    {
        [HttpGet("prueba")]
        public ActionResult Get()
        {
            logger.LogInformation("Este mensaje se va a guardar en el archivo de log4net");
            logger.LogWarning("Esto es una advertencia");
            logger.LogError("Esto es un error de prueba");
            return Ok("Logs escritos correctamente.");
        }

        


        // 🔹 GET: Obtener todos
        [HttpGet("listar")]
        public async Task<ActionResult<List<CatalogoTipoDTO>>> ObtenerTodos()
        {
            logger.LogInformation("esto es una prueba de log");
            var lista = await servicio.ListarAsync();
            return lista.ToList();
        }

        // 🔹 GET: Obtener por ID
        [HttpGet("obtener/{id}")]
        public async Task<ActionResult<CatalogoTipoDTO>> ObtenerPorId(int id)
        {
            var item = await servicio.ObtenerByIdAsync(id);
            if (item == null)
                return NotFound(new { mensaje = "No se encontró el catálogo tipo." });
            return item;
        }

        [HttpPost("insertar")]
        public async Task<ActionResult> Insertar(CatalogoTipoDTO catalogoTipoDTO)
        {
            int idNuevo = await servicio.CrearAsync(catalogoTipoDTO);

            return Ok(new
            {
                mensaje = "Registro insertado correctamente",
                idGenerado = idNuevo
            });
        }

        // 🔹 PUT: Actualizar
        [HttpPut("actualizar")]
        public async Task<ActionResult> Actualizar(CatalogoTipoDTO dto)
        {
            if (dto.IdCatalogoTipo is null)
                return BadRequest(new { mensaje = "El campo IdCatalogoTipo es obligatorio." });

            await servicio.ActualizarAsync(dto);
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
