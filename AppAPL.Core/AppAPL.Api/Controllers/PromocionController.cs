using AppAPL.Api.Attributes;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Promocion;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[ApiExplorerSettings(IgnoreApi = true)]

    public class PromocionController(ILogger<PromocionController> logger, IPromocionServicio servicio) : ControllerBase
    {

        [HttpGet("consultar-promocion")]
        public async Task<ActionResult<List<PromocionDTO>>> ConsultarPromocion()
        {
            var listaPromocion = await servicio.ConsultarPromocion();

            return listaPromocion.ToList();
        }

        [HttpGet("consultar-promocion-acuerdo")]
        public async Task<ActionResult<List<PromocionAcuerdoDTO>>> ConsultarPromocionAcuerdo()
        {
            var listaPromocionAcuerdo = await servicio.ConsultarPromocionAcuerdo();

            return listaPromocionAcuerdo.ToList();
        }

        [HttpGet("consultar-promocion-articulo")]
        public async Task<ActionResult<List<PromocionArticuloDTO>>> ConsultarPromocionArticulo()
        {
            var listaPromocionArticulo = await servicio.ConsultarPromocionArticulo();

            return listaPromocionArticulo.ToList();
        }

        [HttpGet("consultar-promocion-segmento")]
        public async Task<ActionResult<List<PromocionSegmentoDTO>>> ConsultarPromocionSegmento()
        {
            var listaPromocionSegmento = await servicio.ConsultarPromocionSegmento();

            return listaPromocionSegmento.ToList();
        }

        [HttpGet("consultar-promocion-segmento-detalle")]
        public async Task<ActionResult<List<PromocionSegmentoDetalleDTO>>> ConsultarPromocionSegmentoDetalle()
        {
            var listaPromSegDetalle = await servicio.ConsultarPromocionSegmentoDetalle();

            return listaPromSegDetalle.ToList();
        }


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

        [HttpPost("consultar-combos-promociones")]
        public async Task<ActionResult<GruposPromocionesDTO>> ConsultarTipoCliente(ConsultarCombosPromocionesDTO consultar)
        {
            var combosPromociones = await servicio.CargarCombosPromociones(consultar);

            return combosPromociones;
        }

        [HttpPost("insertar")]
        //[Email("ENTACUERDO", TipoProceso.Creacion)]
        public async Task<ActionResult<ControlErroresDTO>> Insertar(CrearPromocionRequestDTO promocion)
        {

            var retorno = await servicio.CrearAsync(promocion);

            if (retorno.Id > 0)
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
    }
}
