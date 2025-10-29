using AppAPL.Portal.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers
{
    public class CatalogoController : Controller
    {
        

        public CatalogoController(CatalogoApiClient catalogoApiClient)
        {
           
        }
        public async Task<IActionResult> Index()
        {
            //var catalogos = await catalogoApiClient.ListarAsync();
            return View();
        }
    }
}
