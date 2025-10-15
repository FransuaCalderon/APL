using AppAPL.Portal.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers
{
    public class CatalogoController : Controller
    {
        private readonly CatalogoApiClient catalogoApiClient;

        public CatalogoController(CatalogoApiClient catalogoApiClient)
        {
            this.catalogoApiClient = catalogoApiClient;
        }
        public async Task<IActionResult> Index()
        {
            var catalogos = await catalogoApiClient.ListarAsync();
            return View(catalogos);
        }
    }
}
