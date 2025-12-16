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
        [HttpGet("listar")]
        public async Task<ActionResult<List<AcuerdoDTO>>> ObtenerTodos()
        {
            
            var listaAcuerdos = await servicio.ListarAsync();

            return listaAcuerdos.ToList();
        }

        [HttpGet("listar-acuerdo-fondo")]
        public async Task<ActionResult<List<AcuerdoFondoDTO>>> ObtenerAcuerdosFondosAsync()
        {

            var listaAcuerdosFondos = await servicio.ObtenerAcuerdosFondosAsync();

            return listaAcuerdosFondos.ToList();
        }

        // 🔹 GET: Obtener por ID
        [HttpGet("obtener/{id:int}")]
        public async Task<ActionResult<AcuerdoDTO>> ObtenerPorId(int id)
        {

            var item = await servicio.ObtenerPorIdAsync(id);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el acuerdo con ese id {id}" });
            return item;
        }

        [HttpGet("obtener-acuerdo-fondo/{id:int}")]
        public async Task<ActionResult<AcuerdoFondoDTO>> ObtenerAcuerdoFondoPorIdAsync(int id)
        {

            var item = await servicio.ObtenerAcuerdoFondoPorIdAsync(id);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el acuerdo fondo con ese id {id}" });
            return item;
        }

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

        [HttpGet("bandeja-aprobacion-id/{idAcuerdo:int}/{idAprobacion:int}")]
        public async Task<ActionResult<BandAproAcuerdoPorIDDTO>> ObtenerBandejaAprobacionPorId(int idAcuerdo, int idAprobacion)
        {

            var item = await servicio.ObtenerBandejaAprobacionPorId(idAcuerdo, idAprobacion);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el aprobacion con ese idAcuerdo: {idAcuerdo}, idAprobacion: {idAprobacion}" });

            return item;
        }

        [HttpGet("bandeja-modificacion-id/{idAcuerdo:int}")]
        public async Task<ActionResult<BandModAcuerdoPorIDDTO>> ObtenerBandejaModificacionPorId(int idAcuerdo)
        {

            var item = await servicio.ObtenerBandejaModificacionPorId(idAcuerdo);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el modificacion con ese idAcuerdo: {idAcuerdo}" });

            return item;
        }

        [HttpGet("consultar-bandeja-modificacion")]
        public async Task<ActionResult<List<BandejaModificacionAcuerdoDTO>>> ConsultarBandModAcuerdo()
        {

            var listaBandeja = await servicio.ConsultarBandModAcuerdo();

            return listaBandeja.ToList();
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
    }
}
