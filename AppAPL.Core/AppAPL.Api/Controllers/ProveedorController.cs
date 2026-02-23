using AppAPL.Api.Attributes;
using AppAPL.Dto.Proveedor;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedorController(IProveedorServicio servicio, ILogger<ProveedorController> logger) : ControllerBase
    {
        [HttpGet("listar/{etiqueta?}")]
        public async Task<ActionResult<List<ProveedorDTO>>> listar([SwaggerParameter(Description = "Parámetro opcional", Required = false)]  string? etiqueta = "")
        {
            logger.LogInformation($"etiqueta: {etiqueta}");
            var listaProveedores = await servicio.ListarAsync(etiqueta);

            return listaProveedores.Take(50).ToList();
        }

        [HttpGet("obtener/{identificacion}")]
        public async Task<ActionResult<ProveedorDTO>> ObtenerPorIdAsync(string identificacion)
        {
            var item = await servicio.ObtenerPorIdAsync(identificacion);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontro proveedor con el id: {identificacion}" });
            return item;
        }
    }
}
