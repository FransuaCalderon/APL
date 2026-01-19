using AppAPL.Dto.Promocion;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [ApiExplorerSettings(IgnoreApi = true)]

    public class PromocionController(ILogger<PromocionController> logger, IPromocionServicio servicio) : ControllerBase
    {

        [HttpGet("consultar-almacen")]
        public async Task<ActionResult<List<AlmacenDTO>>> ConsultarAlmacen()
        {
            var listaAlmacen = await servicio.ConsultarAlmacen();

            return listaAlmacen.ToList();
        }

        [HttpGet("consultar-articulo-equivalente")]
        public async Task<ActionResult<List<ArticuloEquivalenteDTO>>> ConsultarArticuloEquivalente()
        {
            var listaArtEq = await servicio.ConsultarArticuloEquivalente();

            return listaArtEq.ToList();
        }

        [HttpGet("consultar-articulo-precio-competencia")]
        public async Task<ActionResult<List<ArticuloPrecioCompetenciaDTO>>> ConsultarArticuloPrecioCompetencia()
        {
            var listaArtPreCom = await servicio.ConsultarArticuloPrecioCompetencia();

            return listaArtPreCom.ToList();
        }

        [HttpGet("consultar-canal")]
        public async Task<ActionResult<List<CanalDTO>>> ConsultarCanal()
        {
            var listaCanal = await servicio.ConsultarCanal();

            return listaCanal.ToList();
        }

        [HttpGet("consultar-grupo-almacen")]
        public async Task<ActionResult<List<GrupoAlmacenDTO>>> ConsultarGrupoAlmacen()
        {
            var listaGruAlm = await servicio.ConsultarGrupoAlmacen();

            return listaGruAlm.ToList();
        }

        [HttpGet("consultar-otros-costos")]
        public async Task<ActionResult<List<OtrosCostosDTO>>> ConsultarOtrosCostos()
        {
            var listaOtCs = await servicio.ConsultarOtrosCostos();

            return listaOtCs.ToList();
        }

        [HttpGet("consultar-tipo-cliente")]
        public async Task<ActionResult<List<TipoClienteDTO>>> ConsultarTipoCliente()
        {
            var listaTiCl = await servicio.ConsultarTipoCliente();

            return listaTiCl.ToList();
        }
    }
}
