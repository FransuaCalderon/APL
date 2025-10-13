using AppAPL.Portal.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers
{
    public class OpcionesController : Controller
    {
        private readonly OpcionesApiClient opcionesApiClient;
        private readonly CatalogoApiClient catalogoApiClient;
        private readonly CatalogoTipoApiCliente catalogoTipoApiCliente;

        public OpcionesController(OpcionesApiClient opcionesApiClient, CatalogoApiClient catalogoApiClient, CatalogoTipoApiCliente catalogoTipoApiCliente)
        {
            this.opcionesApiClient = opcionesApiClient;
            this.catalogoApiClient = catalogoApiClient;
            this.catalogoTipoApiCliente = catalogoTipoApiCliente;
        }

        //[HttpGet]
        public async Task<IActionResult> Index()
        {
            var opciones = await opcionesApiClient.ListarAsync();
            return View(opciones);
        }


        public async Task<IActionResult> Catalogo()
        {
            var catalogos = await catalogoApiClient.ListarAsync();
            return View(catalogos);
        }


        public async Task<IActionResult> CatalogoTipo()
        {
            var catalogoTipos = await catalogoTipoApiCliente.ListarAsync();
            return View(catalogoTipos);
        }
    }
}
