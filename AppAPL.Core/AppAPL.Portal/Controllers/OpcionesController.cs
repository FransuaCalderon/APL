using AppAPL.Portal.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers
{
    public class OpcionesController : Controller
    {
        

        public OpcionesController()
        {
            
        }

        //[HttpGet]
        public async Task<IActionResult> Index()
        {
            //var opciones = await opcionesApiClient.ListarAsync();
            return View();
        }


        


        
    }
}
