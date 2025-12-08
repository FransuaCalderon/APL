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

        [HttpGet("bandeja-aprobacion-id/{idAcuerdo:int}")]
        public async Task<ActionResult<BandejaAprobacionAcuerdoDTO>> ObtenerBandejaAprobacionPorId(int idAcuerdo)
        {

            var item = await servicio.ObtenerBandejaAprobacionPorId(idAcuerdo);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el aprobacion con ese idAcuerdo: {idAcuerdo}" });

            return item;
        }


        [HttpPost("insertar")]
        [Email("ENTACUERDO", TipoProceso.Creacion)]
        public async Task<ActionResult<ControlErroresDTO>> Insertar(CrearActualizarAcuerdoGrupoDTO acuerdo)
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

     

    }
}
