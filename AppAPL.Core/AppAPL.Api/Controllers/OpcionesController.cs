using AppAPL.Dto.Opciones;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OpcionesController(IOpcionServicio servicio) : ControllerBase
    {
        [HttpGet]
        
        public async Task<ActionResult<List<OpcionDto>>> Get([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int size = 20, CancellationToken ct = default)
            => Ok(await servicio.ListarAsync(q, page, size, ct));

        [HttpGet("{id:int}")]
        public async Task<ActionResult<OpcionDto>> GetById(int id, CancellationToken ct)
            => (await servicio.ObtenerPorIdAsync(id, ct)) is { } dto ? Ok(dto) : NotFound();

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CreateOpcionRequest req, CancellationToken ct)
        {
            var id = await servicio.CrearAsync(req, ct);
            return CreatedAtAction(nameof(GetById), new { id }, new { id });
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult> Update(int id, [FromBody] UpdateOpcionRequest req, CancellationToken ct)
        {
            if (id != req.IdOpcion) return BadRequest("Id inconsistente.");
            await servicio.ActualizarAsync(req, ct);
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult> SoftDelete(int id, [FromQuery] int usuario, CancellationToken ct)
        {
            await servicio.EliminarLogicoAsync(id, usuario, ct);
            return NoContent();
        }
    }
}