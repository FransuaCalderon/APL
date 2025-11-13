using AppAPL.Api.Attributes;
using AppAPL.Dto.Proveedor;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProveedorController(IProveedorServicio servicio, ILogger<ProveedorController> logger) : ControllerBase
    {
        [HttpGet("listar")]
        //[Aprobacion]
        public async Task<ActionResult<List<ProveedorDTO>>> listar()
        {
            var listaProveedores = await servicio.ListarAsync();

            return listaProveedores.ToList();
        }

        [HttpGet("obtener/{identificacion}")]
        //[Aprobacion]
        public async Task<ActionResult<ProveedorDTO>> ObtenerPorIdAsync(string identificacion)
        {
            var item = await servicio.ObtenerPorIdAsync(identificacion);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontro proveedor con el id: {identificacion}" });
            return item;
        }
    }
}
