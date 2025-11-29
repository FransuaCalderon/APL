using AppAPL.Api.Attributes;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
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

        [HttpGet("consultar-marcas")]
        public async Task<ActionResult<List<MarcaDTO>>> ConsultarMarcas()
        {
            var listaMarcas = await servicio.ConsultarMarcas();

            return listaMarcas.ToList();
        }

        [HttpGet("consultar-divisiones")]
        public async Task<ActionResult<List<DivisionDTO>>> ConsultarDivisiones()
        {
            var listaDivisiones = await servicio.ConsultarDivisiones();

            return listaDivisiones.ToList();
        }

        [HttpGet("consultar-departamentos")]
        public async Task<ActionResult<List<DepartamentoDTO>>> ConsultarDepartamentos()
        {
            var listaDepartamentos = await servicio.ConsultarDepartamentos();

            return listaDepartamentos.ToList();
        }

        [HttpGet("consultar-clases")]
        public async Task<ActionResult<List<ClaseDTO>>> ConsultarClases()
        {
            var listaClases = await servicio.ConsultarClases();

            return listaClases.ToList();
        }

        [HttpGet("consultar-articulos/{idMarca:int}/{idDivision:int}/{idDepartamento:int}/{idClase:int}")]
        public async Task<ActionResult<List<ArticuloDTO>>> ConsultarArticulos(int idMarca, int idDivision, int idDepartamento, int idClase)
        {
            var listaArticulos = await servicio.ConsultarArticulos(idMarca, idDivision, idDepartamento, idClase);

            return listaArticulos.ToList();
        }

        [HttpGet("obtener-articulo-por-id/{id:int}")]
        public async Task<ActionResult<ArticuloDTO>> ObtenerArticuloPorId(int idArticulo)
        {
            
            var item = await servicio.ObtenerArticuloPorId(idArticulo);
            if (item == null)
                return NotFound(new { mensaje = $"No se encontró el articulo con ese id {idArticulo}" });
            return item;
        }


        [HttpPost("insertar")]
        //[Email("ENTACUERDO", TipoProceso.Creacion)]
        public async Task<ActionResult<ControlErroresDTO>> Insertar(CrearActualizarAcuerdoDTO acuerdo)
        {
            
            var retorno = await servicio.CrearAsync(acuerdo);

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
