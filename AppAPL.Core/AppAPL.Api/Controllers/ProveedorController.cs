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
        
        public async Task<ActionResult<List<ProveedorDTO>>> listar()
        {
            var listaProveedores = await servicio.ListarAsync();

            return listaProveedores.ToList();
        }
    }
}
