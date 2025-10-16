using AppAPL.Portal.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers
{
    public class OpcionesController : Controller
    {
        private readonly OpcionesApiClient opcionesApiClient;
        private readonly CatalogoApiClient catalogoApiClient;

        public OpcionesController(OpcionesApiClient opcionesApiClient)
        {
            this.opcionesApiClient = opcionesApiClient;
        }

        //[HttpGet]
        public async Task<IActionResult> Index()
        {
            //var opciones = await opcionesApiClient.ListarAsync();
            return View();
        }


        


        
    }
}
