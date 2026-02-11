using AppAPL.Api.Attributes;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Promocion;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

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

        [HttpGet("consultar-combos-promociones")]
        public async Task<ActionResult<GruposPromocionesDTO>> CargarCombosPromociones()
        {
            var combosPromociones = await servicio.CargarCombosPromociones();

            return combosPromociones;
        }

        [HttpGet("consultar-bandeja-aprobacion/{usuarioAprobador}")]
        public async Task<ActionResult<List<BandAproPromocionDTO>>> ConsultarBandAprobPromocion(string usuarioAprobador)
        {

            var listaBandeja = await servicio.ConsultarBandAprobPromocion(usuarioAprobador);

            return listaBandeja.ToList();
        }

        [HttpGet("consultar-bandeja-inactivacion")]
        public async Task<ActionResult<List<BandInacPromocionDTO>>> ConsultarBandInacAcuerdo()
        {

            var listaBandeja = await servicio.ConsultarBandInacPromocion();

            return listaBandeja.ToList();
        }

        [HttpPost("insertar")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ControlErroresDTO>> Insertar(
            IFormFile ArchivoSoporte,
            [FromForm] string promocionJson)     // Todo el resto de datos como un string JSON
        {
            // 1. Validar que el archivo no sea nulo
            if (ArchivoSoporte == null || ArchivoSoporte.Length == 0)
                return BadRequest("El archivo de soporte es obligatorio.");

            // 2. Validar extensión
            var extensionesPermitidas = new[] { ".pdf", ".xls", ".xlsx" };
            var extension = Path.GetExtension(ArchivoSoporte.FileName).ToLower();

            if (!extensionesPermitidas.Contains(extension))
            {
                return BadRequest(new ControlErroresDTO
                {
                    mensaje = $"Extensión {extension} no permitida. Use: PDF, JPG o PNG.",
                    codigoRetorno = 0
                });
            }

            // 2. Deserializar el JSON que contiene el resto de los campos
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var promocionDto = JsonSerializer.Deserialize<CrearPromocionRequestDTO>(promocionJson, options);

            if (promocionDto == null)
                return BadRequest("El formato del JSON de datos es incorrecto.");

            logger.LogInformation($"ArchivoSoporte.FileName: {ArchivoSoporte.FileName}");
            logger.LogInformation($"TipoClaseEtiqueta: {promocionDto.TipoClaseEtiqueta}");
           

            // 3. Inyectar el archivo al DTO para que el servicio siga funcionando igual
            promocionDto.ArchivoSoporte = ArchivoSoporte;

            // 4. Llamar al servicio
            var retorno = await servicio.CrearAsync(promocionDto);

            return retorno.codigoRetorno == 1 ? Ok(retorno) : BadRequest(retorno);
        }
    }
}
