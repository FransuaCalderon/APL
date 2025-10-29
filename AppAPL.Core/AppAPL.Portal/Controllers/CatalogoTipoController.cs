using AppAPL.Portal.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers
{
    public class CatalogoTipoController : Controller
    {
        

        public CatalogoTipoController()
        {
           
        }


        public async Task<IActionResult> Index()
        {
            //var catalogoTipos = await catalogoTipoApiCliente.ListarAsync();
            return View();
        }
    }
}
