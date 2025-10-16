using AppAPL.Portal.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers
{
    public class CatalogoTipoController : Controller
    {
        private readonly CatalogoTipoApiCliente catalogoTipoApiCliente;

        public CatalogoTipoController(CatalogoTipoApiCliente catalogoTipoApiCliente)
        {
            this.catalogoTipoApiCliente = catalogoTipoApiCliente;
        }


        public async Task<IActionResult> Index()
        {
            //var catalogoTipos = await catalogoTipoApiCliente.ListarAsync();
            return View();
        }
    }
}
