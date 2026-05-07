using AppAPL.Dto;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ValidacionAporteController(ILogger<ValidacionAporteController> logger, IValidacionAporteServicio servicio) : ControllerBase
    {
        [HttpGet("consultar-aporte-por-marca/{codigoMarca}")]
        public async Task<ActionResult<List<AportesPorMarcaDTO>>> ConsultarAportesPorMarca(string codigoMarca)
        {
            var listaAportes = await servicio.ConsultarAportesPorMarca(codigoMarca);

            return listaAportes.ToList();
        }

        [HttpGet("consultar-aporte-por-articulo/{codigoArticulo}")]
        public async Task<ActionResult<List<AportesPorArticuloDTO>>> ConsultarAportesPorArticulo(string codigoArticulo)
        {
            var listaAportes = await servicio.ConsultarAportesPorArticulo(codigoArticulo);

            return listaAportes.ToList();
        }


        [HttpGet("consultar-aporte-marca-proveedor/{codigoMarca}/{identificacion}")]
        public async Task<ActionResult<List<AportesPorMarcaProveedorDTO>>> ConsultarAportesPorMarcaProveedor(string codigoMarca, string identificacion)
        {
            var listaAportes = await servicio.ConsultarAportesPorMarcaProveedor(codigoMarca, identificacion);

            return listaAportes.ToList();
        }
    }
}
