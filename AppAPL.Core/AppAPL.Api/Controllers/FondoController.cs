
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
        public async Task<ActionResult<List<FondoDTO>>> ObtenerTodos([FromQuery] string? nombre = null,
        [FromQuery] int? idEstado = null,
        [FromQuery] DateTime? creadoDesde = null,
        [FromQuery] DateTime? creadoHasta = null,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50)
        {

            //var listaFondos = await servicio.ListarAsync(nombre, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);

            var listaFondos = new List<FondoDTO>()
            {
                new FondoDTO()
                {
                    IdFondo = 0,
                    DescripcionFondo = "fondo de prueba",
                    EstadoRegistro = 0,
                    FechaInicioVigencia = DateTime.Now,
                    FechaFinVigencia = DateTime.Now,
                    IdProveedor = 0,
                    IndicadorCreacion = 0,
                    TipoFondo = 0,
                    ValorComprometido = 10000,
                    ValorDisponible = 10000,
                    ValorFondo = 10000,
                    ValorLiquidado = 10000
                },
                new FondoDTO()
                {
                    IdFondo = 0,
                    DescripcionFondo = "fondo de prueba",
                    EstadoRegistro = 0,
                    FechaInicioVigencia = DateTime.Now,
                    FechaFinVigencia = DateTime.Now,
                    IdProveedor = 0,
                    IndicadorCreacion = 0,
                    TipoFondo = 0,
                    ValorComprometido = 10000,
                    ValorDisponible = 10000,
                    ValorFondo = 10000,
                    ValorLiquidado = 10000
                }
            };

            return listaFondos.ToList();
        }
    }
}
