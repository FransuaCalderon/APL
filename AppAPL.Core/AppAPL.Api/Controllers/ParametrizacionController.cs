using AppAPL.Api.Attributes;
using AppAPL.Dto;
using AppAPL.Dto.Parametrizacion;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ParametrizacionController(ILogger<ParametrizacionController> logger, IParametrizacionServicio servicio) : ControllerBase
    {
        [HttpGet("consultar-parametros")]
        public async Task<ActionResult<List<ParametroConfigDTO>>> ConsultarParametros()
        {
            var listaParametro = await servicio.ConsultarParametros();

            return listaParametro.ToList();
        }

        [HttpGet("consultar-grupo-almacen")]
        public async Task<ActionResult<List<GruposAlmacenConfigDTO>>> ConsultarGrupoAlmacen()
        {
            var listaGrupo = await servicio.ConsultarGrupoAlmacen();

            return listaGrupo.ToList();
        }

        [HttpGet("consultar-almacen-grupo/{codigo:int}")]
        public async Task<ActionResult<List<AlmacenesGrupoConfigDTO>>> ConsultarAlmacenGrupo(int codigo)
        {
            var listaAlmacen = await servicio.ConsultarAlmacenGrupo(codigo);

            return listaAlmacen.ToList();
        }

        [HttpGet("consultar-medios-pago")]
        public async Task<ActionResult<List<MediosPagoConfigDTO>>> ConsultarMediosPago()
        {
            var listaMedios = await servicio.ConsultarMediosPago();

            return listaMedios.ToList();
        }

        [HttpGet("consultar-aporte-marca")]
        public async Task<ActionResult<List<AportesMarcaDTO>>> ConsultarAportesMarca()
        {
            var listaAportes = await servicio.ConsultarAportesMarca();

            return listaAportes.ToList();
        }

        [HttpGet("consultar-aporte-marca-prov")]
        public async Task<ActionResult<List<AportesMarcaProvDTO>>> ConsultarAportesMarcaProv()
        {
            var listaAportes = await servicio.ConsultarAportesMarcaProv();

            return listaAportes.ToList();
        }

        [HttpGet("consultar-aporte-articulo")]
        public async Task<ActionResult<List<AportesArticuloDTO>>> ConsultarAportesArticulo()
        {
            var listaAportes = await servicio.ConsultarAportesArticulo();

            return listaAportes.ToList();
        }

        [HttpGet("consultar-precios-competencia")]
        public async Task<ActionResult<List<PreciosCompetenciaDTO>>> ConsultarPreciosCompetencia()
        {
            var listaPrecios = await servicio.ConsultarPreciosCompetencia();

            return listaPrecios.ToList();
        }

        [HttpGet("consultar-margen-minimo")]
        public async Task<ActionResult<List<MargenMinimoDTO>>> ConsultarMargenMinimo()
        {
            var listaMargen = await servicio.ConsultarMargenMinimo();

            return listaMargen.ToList();
        }

        [HttpGet("consultar-porcentaje-incremento")]
        public async Task<ActionResult<List<PorcIncrementoDTO>>> ConsultarPorcIncremento()
        {
            var listaPorcentaje = await servicio.ConsultarPorcIncremento();

            return listaPorcentaje.ToList();
        }

        [HttpGet("consultar-otros-costos")]
        public async Task<ActionResult<List<OtrosCostosConfigDTO>>> ConsultarOtrosCostos()
        {
            var listaOtrosCostos = await servicio.ConsultarOtrosCostos();

            return listaOtrosCostos.ToList();
        }


        [HttpPost("mantenimiento-parametros")]
        public async Task<ActionResult<MantenimientoParametrosResponseDTO>> MantParametros(MantenimientoParametrosRequestDTO request)
        {

            var retorno = await servicio.MantParametros(request);

            if (retorno.cod_respuesta == 0)
            {
                logger.LogInformation(retorno.msg_respuesta);
                return retorno;
            }
            else
            {

                logger.LogError(retorno.msg_respuesta);
                return BadRequest(retorno);
            }

        }
    }
}
