using Microsoft.AspNetCore.Mvc;

namespace AppWebAPL.Controllers
{
    public class FondoController : Controller
    {
        public async Task<IActionResult> CrearFondo()
        {
            return View();
        }

        public async Task<IActionResult> AprobarFondo()
        {
            return View();
        }
        public async Task<IActionResult> ModificarFondo()
        {
            return View();
        }

        public async Task<IActionResult> InactivarFondo()
        {
            return View();
        }
    }
}
