using AppAPL.Api.Attributes;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Promocion;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;
using System.Configuration;
using System.Text.Json;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[ApiExplorerSettings(IgnoreApi = true)]

    public class PromocionController(ILogger<PromocionController> logger, IPromocionServicio servicio, IConfiguration configuration) : ControllerBase
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

        [HttpGet("consultar-acuerdo/{tipoFondo}/{claseAcuerdo}")]
        public async Task<ActionResult<List<AcuerdoPromoDTO>>> ConsultarAcuerdo(string tipoFondo, string claseAcuerdo)
        {

            var listaBandeja = await servicio.ConsultarAcuerdo(tipoFondo.Trim(), claseAcuerdo.Trim());

            return listaBandeja.ToList();
        }

        [HttpGet("consultar-bandeja-aprobacion/{usuarioAprobador}")]
        public async Task<ActionResult<List<BandAproPromocionDTO>>> ConsultarBandAprobPromocion(string usuarioAprobador)
        {

            var listaBandeja = await servicio.ConsultarBandAprobPromocion(usuarioAprobador);

            return listaBandeja.ToList();
        }

        [HttpGet("bandeja-aprobacion-id/{idPromocion:int}/{idAprobacion:int}")]
        public async Task<ActionResult<BandAproPromocionIDDTO>> ObtenerBandAproPromoPorId(int idPromocion, int idAprobacion)
        {

            var item = await servicio.ObtenerBandAproPromoPorId(idPromocion, idAprobacion);
            if (item.codigoSalida == 0)
            {
                logger.LogInformation(item.mensajeSalida);
                return item;
            }
            else
            {
                logger.LogError(item.mensajeSalida);
                return BadRequest(new { mensaje = item.mensajeSalida });
            }
        }

        [HttpGet("consultar-bandeja-inactivacion")]
        public async Task<ActionResult<List<BandInacPromocionDTO>>> ConsultarBandInacPromocion()
        {

            var listaBandeja = await servicio.ConsultarBandInacPromocion();

            return listaBandeja.ToList();
        }

        [HttpGet("bandeja-inactivacion-id/{idPromocion:int}")]
        public async Task<ActionResult<BandInacAcuerdoPorIDDTO>> ObtenerBandejaInactivacionPorId(int idPromocion)
        {
            /*
            var item = await servicio.ObtenerBandejaInactivacionPorId(idAcuerdo);
            if (item.codigoSalida == 0)
            {
                logger.LogInformation(item.mensajeSalida);
                return item;
            }
            else
            {
                logger.LogError(item.mensajeSalida);
                return BadRequest(new { mensaje = item.mensajeSalida });
            }*/
            return Ok();
        }

        [HttpGet("consultar-bandeja-modificacion")]
        public async Task<ActionResult<List<BandejaModificacionAcuerdoDTO>>> ConsultarBandModAcuerdo()
        {
            /*
            var listaBandeja = await servicio.ConsultarBandModAcuerdo();

            return listaBandeja.ToList();
            */
            return Ok();
        }

        [HttpGet("bandeja-modificacion-id/{idPromocion:int}")]
        public async Task<ActionResult<BandModAcuerdoPorIDDTO>> ObtenerBandejaModificacionPorId(int idPromocion)
        {
            /*
            var item = await servicio.ObtenerBandejaModificacionPorId(idPromocion);
            if (item.codigoSalida == 0)
            {
                logger.LogInformation(item.mensajeSalida);
                return item;
            }
            else
            {
                logger.LogError(item.mensajeSalida);
                return BadRequest(new { mensaje = item.mensajeSalida });
            }*/

            return Ok();
        }

        [HttpGet("consultar-bandeja-general")]
        public async Task<ActionResult<List<BandejaConsultaAcuerdoDTO>>> ConsultarBandConsPromocion()
        {
            /*
            var listaBandeja = await servicio.ConsultarBandConsAcuerdo();

            return listaBandeja.ToList();*/
            return Ok();
        }

        [HttpGet("bandeja-general-id/{idPromocion:int}")]
        public async Task<ActionResult<BandConsAcuerdoPorIDDTO>> ObtenerBandejaConsultaPorId(int idPromocion)
        {
            /*
            var item = await servicio.ObtenerBandejaConsultaPorId(idAcuerdo);

            if (item.codigoSalida == 0)
            {
                logger.LogInformation(item.mensajeSalida);
                return item;
            }
            else
            {
                logger.LogError(item.mensajeSalida);
                return BadRequest(new { mensaje = item.mensajeSalida });
            }*/
            return Ok();
        }

        [HttpPost("insertar")]
        public async Task<ActionResult<ControlErroresDTO>> Insertar([FromBody] CrearPromocionRequestDTO promocion)
        {
            // 1. Validar que el string no sea nulo o vacío
            if (string.IsNullOrEmpty(promocion.ArchivoSoporteBase64))
            {
                return BadRequest(new ControlErroresDTO { mensaje = "El archivo de soporte es obligatorio." });
            }

            // 2. Obtener la 'carnita' del Base64 (quitar el encabezado si existe)
            string base64Data = promocion.ArchivoSoporteBase64.Contains(",")
                                ? promocion.ArchivoSoporteBase64.Split(',')[1]
                                : promocion.ArchivoSoporteBase64;

            // 3. VALIDACIÓN DE TAMAÑO (Sobre los bytes reales)
            // Fórmula rápida: cada 4 caracteres Base64 son ~3 bytes
            byte[] archivoBytes = Convert.FromBase64String(base64Data);
            double tamanoMB = (double)archivoBytes.Length / (1024 * 1024);

            // Traemos el límite del appsettings
            int limiteMaxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");

            if (tamanoMB > limiteMaxMB)
            {
                return BadRequest(new ControlErroresDTO
                {
                    mensaje = $"El archivo excede el límite permitido de {limiteMaxMB}MB (Tamaño enviado: {tamanoMB:N2}MB)."
                });
            }

            // 4. VALIDACIÓN DE EXTENSIÓN
            var extensionesPermitidas = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>();
            string extensionArchivo = Path.GetExtension(promocion.NombreArchivoSoporte)?.ToLower();

            if (string.IsNullOrEmpty(extensionArchivo) || !extensionesPermitidas.Contains(extensionArchivo))
            {
                return BadRequest(new ControlErroresDTO
                {
                    mensaje = $"Extensión {extensionArchivo} no permitida. Solo se aceptan: {string.Join(", ", extensionesPermitidas)}"
                });
            }

            // 5. Si todo está OK, procedemos al servicio
            var retorno = await servicio.CrearAsync(promocion);

            if (retorno.Id > 0) // Usando tu lógica de éxito
            {
                logger.LogInformation(retorno.mensaje);
                return Ok(retorno);
            }
            else
            {
                logger.LogError(retorno.mensaje);
                return BadRequest(retorno);
            }
        }

        [HttpPost("aprobar-promocion")]
        
        public async Task<ActionResult<ControlErroresDTO>> AprobarPromocion(AprobarPromocionRequest promocion)
        {

            var retorno = await servicio.AprobarPromocion(promocion);

            if (retorno.codigoRetorno == 0)
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

        [HttpPost("inactivar-promocion")]
        //[Email("ENTACUERDO", TipoProceso.Inactivacion)]
        public async Task<ActionResult<ControlErroresDTO>> InactivarAcuerdo(InactivarAcuerdoRequest acuerdo)
        {
            /*
            var retorno = await servicio.InactivarAcuerdo(acuerdo);

            if (retorno.codigoRetorno == 0)
            {
                logger.LogInformation(retorno.mensaje);
                return retorno;
            }
            else
            {

                logger.LogError(retorno.mensaje);
                return BadRequest(retorno);
            }
            */
            return Ok();
        }


        [HttpPost("actualizar-promocion")]
        //[Email("ENTACUERDO", TipoProceso.Modificacion)]
        public async Task<ActionResult<ControlErroresDTO>> ActualizarAcuerdo(ActualizarAcuerdoDTO actualizarAcuerdoDTO)
        {
            /*
            var retorno = await servicio.ActualizarAsync(actualizarAcuerdoDTO);

            if (retorno.codigoRetorno == 0)
            {
                logger.LogInformation(retorno.mensaje);
                return retorno;
            }
            else
            {

                logger.LogError(retorno.mensaje);
                return BadRequest(retorno);
            }
            */

            return Ok();
        }
    }
}
