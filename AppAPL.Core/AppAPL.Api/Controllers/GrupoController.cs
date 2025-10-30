using AppAPL.Dto.Catalogo;
using AppAPL.Dto.Grupo;
using AppAPL.Dto.Opciones;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [ApiExplorerSettings(IgnoreApi = true)] // 👈 Oculta este controlador del Swagger
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
            var listaOpciones = await opcionServicio.ListarAsync();

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


            //---------temporal  --------
            var grupoTemporal = new GrupoDTO()
            {
                Catalogo = new CatalogoDTO()
                {
                    IdCatalogo = 0,
                    Nombre = "Configuracion",
                    Adicional = "",
                    Abreviatura = "",
                    IdCatalogoTipo = 9,
                    IdUsuarioCreacion = 1,
                    FechaCreacion = DateTime.Now,
                    IdUsuarioModificacion = 1,
                    FechaModificacion = DateTime.Now,
                    IdEstado = 0,
                    IdEtiqueta = "GRconfig"

                },
                Opciones = new List<OpcionDTO>()
                {
                    new OpcionDTO()
                    {
                        IdOpcion = 0,
                        Nombre = "Tipo Catalogo",
                        Descripcion = "",
                        IdGrupo = 9,
                        Vista = "CatalogoTipo",
                        IdUsuarioCreacion = 1,
                        IdUsuarioModificacion = null,
                        IdEstado = 12,
                        FechaCreacion = DateTime.Now,
                        FechaModificacion = null
                    },
                    new OpcionDTO()
                    {
                        IdOpcion = 0,
                        Nombre = "Catalogo",
                        Descripcion = "",
                        IdGrupo = 9,
                        Vista = "Catalogo",
                        IdUsuarioCreacion = 1,
                        IdUsuarioModificacion = null,
                        IdEstado = 12,
                        FechaCreacion = DateTime.Now,
                        FechaModificacion = null
                    },
                    new OpcionDTO()
                    {
                        IdOpcion = 0,
                        Nombre = "Opciones",
                        Descripcion = "",
                        IdGrupo = 9,
                        Vista = "Opciones",
                        IdUsuarioCreacion = 1,
                        IdUsuarioModificacion = null,
                        IdEstado = 12,
                        FechaCreacion = DateTime.Now,
                        FechaModificacion = null
                    }
                }
            };

            grupos.Add(grupoTemporal);
            //---------------------------


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
