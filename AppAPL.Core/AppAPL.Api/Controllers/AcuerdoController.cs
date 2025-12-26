using AppAPL.Api.Attributes;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;
using static System.Net.Mime.MediaTypeNames;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class AcuerdoController(ILogger<AcuerdoController> logger, IAcuerdoServicio servicio) : ControllerBase
    {

        [HttpGet("consultar-acuerdo-fondo/{idFondo:int}")]
        public async Task<ActionResult<List<ConsultarAcuerdoFondoDTO>>> ConsultarAcuerdoFondo(int idFondo)
        {
            var listaAcuerdoFondos = await servicio.ConsultarAcuerdoFondo(idFondo);

            return listaAcuerdoFondos.ToList();
        }

        [HttpGet("consultar-acuerdo-promocion/{idAcuerdo:int}")]
        public async Task<ActionResult<List<AcuerdoPromocionDTO>>> ConsultarAcuerdoPromocion(int idAcuerdo)
        {
            var listaAcuerdoPromociones = await servicio.ConsultarAcuerdoPromocion(idAcuerdo);

            return listaAcuerdoPromociones.ToList();
        }

        [HttpGet("consultar-fondo-acuerdo")]
        public async Task<ActionResult<List<FondoAcuerdoDTO>>> ConsultarFondoAcuerdo()
        {
            var listaAcuerdoFondos = await servicio.ConsultarFondoAcuerdo();

            return listaAcuerdoFondos.ToList();
        }

        [HttpPost("consultar-articulos")]
        public async Task<ActionResult<List<ArticuloDTO>>> ConsultarArticulos(ConsultarArticuloDTO dto)
        {
            var listaArticulos = await servicio.ConsultarArticulos(dto);

            return listaArticulos.ToList();
        }

        [HttpGet("consultar-combos")]
        public async Task<ActionResult<FiltrosItemsDTO>> CargarCombosFiltrosItems()
        {
            var combos = await servicio.CargarCombosFiltrosItems();

            return combos;
        }

        
        
        [HttpGet("consultar-bandeja-aprobacion/{usuarioAprobador}")]
        public async Task<ActionResult<List<BandejaAprobacionAcuerdoDTO>>> ConsultarBandAprobAcuerdo(string usuarioAprobador)
        {
            
            var listaBandeja = await servicio.ConsultarBandAprobAcuerdo(usuarioAprobador);
            
            return listaBandeja.ToList();
        }

        [HttpGet("bandeja-aprobacion-id/{idAcuerdo:int}/{idAprobacion:int}")]
        public async Task<ActionResult<BandAproAcuerdoPorIDDTO>> ObtenerBandejaAprobacionPorId(int idAcuerdo, int idAprobacion)
        {

            var item = await servicio.ObtenerBandejaAprobacionPorId(idAcuerdo, idAprobacion);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el aprobacion con ese idAcuerdo: {idAcuerdo}, idAprobacion: {idAprobacion}" });

            return item;
        }

        

        [HttpGet("consultar-bandeja-modificacion")]
        public async Task<ActionResult<List<BandejaModificacionAcuerdoDTO>>> ConsultarBandModAcuerdo()
        {

            var listaBandeja = await servicio.ConsultarBandModAcuerdo();

            return listaBandeja.ToList();
        }

        [HttpGet("bandeja-modificacion-id/{idAcuerdo:int}")]
        public async Task<ActionResult<BandModAcuerdoPorIDDTO>> ObtenerBandejaModificacionPorId(int idAcuerdo)
        {

            var item = await servicio.ObtenerBandejaModificacionPorId(idAcuerdo);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró la bandeja modificacion con ese idAcuerdo: {idAcuerdo}" });

            return item;
        }

        [HttpGet("consultar-bandeja-inactivacion")]
        public async Task<ActionResult<List<BandejaInactivacionAcuerdoDTO>>> ConsultarBandInacAcuerdo()
        {

            var listaBandeja = await servicio.ConsultarBandInacAcuerdo();

            return listaBandeja.ToList();
        }

        [HttpGet("bandeja-inactivacion-id/{idAcuerdo:int}")]
        public async Task<ActionResult<BandInacAcuerdoPorIDDTO>> ObtenerBandejaInactivacionPorId(int idAcuerdo)
        {

            var item = await servicio.ObtenerBandejaInactivacionPorId(idAcuerdo);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró la bandeja general con ese idAcuerdo: {idAcuerdo}" });

            return item;
        }

        [HttpGet("consultar-bandeja-general")]
        public async Task<ActionResult<List<BandejaConsultaAcuerdoDTO>>> ConsultarBandConsAcuerdo()
        {

            var listaBandeja = await servicio.ConsultarBandConsAcuerdo();

            return listaBandeja.ToList();
        }

        [HttpGet("bandeja-general-id/{idAcuerdo:int}")]
        public async Task<ActionResult<BandConsAcuerdoPorIDDTO>> ObtenerBandejaConsultaPorId(int idAcuerdo)
        {

            var item = await servicio.ObtenerBandejaConsultaPorId(idAcuerdo);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró la bandeja general con ese idAcuerdo: {idAcuerdo}" });

            return item;
        }

        


        [HttpPost("insertar")]
        [Email("ENTACUERDO", TipoProceso.Creacion)]
        public async Task<ActionResult<ControlErroresDTO>> Insertar(CrearAcuerdoGrupoDTO acuerdo)
        {
            
            var retorno = await servicio.CrearAsync(acuerdo);

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


        [HttpPost("aprobar-acuerdo")]
        [Email("ENTACUERDO", TipoProceso.Aprobacion)]
        public async Task<ActionResult<ControlErroresDTO>> AprobarAcuerdo(AprobarAcuerdoRequest acuerdo)
        {

            var retorno = await servicio.AprobarAcuerdo(acuerdo);

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

        [HttpPost("inactivar-acuerdo")]
        [Email("ENTACUERDO", TipoProceso.Inactivacion)]
        public async Task<ActionResult<ControlErroresDTO>> InactivarAcuerdo(InactivarAcuerdoRequest acuerdo)
        {

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

        }


        [HttpPut("actualizar-acuerdo")]
        [Email("ENTACUERDO", TipoProceso.Modificacion)]
        public async Task<ActionResult<ControlErroresDTO>> ActualizarAcuerdo(ActualizarAcuerdoDTO actualizarAcuerdoDTO)
        {

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
        }
    }
}
