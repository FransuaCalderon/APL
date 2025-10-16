using AppAPL.Dto.Grupo;
using AppAPL.Dto.Opciones;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GrupoController : ControllerBase
    {
        private readonly ILogger<GrupoController> logger;
        private readonly ICatalogoServicio catalogoServicio;
        private readonly IOpcionServicio opcionServicio;

        public GrupoController(ILogger<GrupoController> logger, ICatalogoServicio catalogoServicio, IOpcionServicio opcionServicio)
        {
            this.logger = logger;
            this.catalogoServicio = catalogoServicio;
            this.opcionServicio = opcionServicio;
        }

        [HttpGet("listar/{IdCatalogoTipo:int}")]
        public async Task<ActionResult<List<GrupoDTO>>> ObtenerTodos(int IdCatalogoTipo, [FromQuery] string? nombre = null,
         [FromQuery] int? idGrupo = null,
          [FromQuery] int? idEstado = null,
         [FromQuery] DateTime? creadoDesde = null,
         [FromQuery] DateTime? creadoHasta = null,
         [FromQuery] int pageNumber = 1,
         [FromQuery] int pageSize = 50)
        {

            var listaCatalogo = await catalogoServicio.ListarAsync(nombre, idGrupo, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);
            var listaOpciones = await opcionServicio.ListarAsync(nombre, idGrupo, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);

            var catalogoFiltrado = from filtrado in listaCatalogo
                        where filtrado.IdCatalogoTipo == IdCatalogoTipo
                        select filtrado;

            if (!catalogoFiltrado.Any())
            {
                string mensaje = $"no hay ese tipo de catalogo";
                logger.LogError(mensaje);
                return BadRequest(new { mensaje });
            }

            logger.LogInformation($"catalogo consultados : {catalogoFiltrado.Count()}");

            var grupos = new List<GrupoDTO>();


            foreach (var item in catalogoFiltrado)
            {
                
                var opcionesFiltrado = from filtrado in listaOpciones
                             where filtrado.IdGrupo == item.IdCatalogo
                             select filtrado;

                var grupoDTO = new GrupoDTO()
                {
                    Catalogo = item,
                    Opciones = opcionesFiltrado
                };

                grupos.Add(grupoDTO);
            }

            return grupos;
        }
    }
}
