using Microsoft.AspNetCore.Mvc;

namespace AppWebAPL.Controllers
{
    public class FondoController : Controller
    {
        public async Task<IActionResult> CrearFondo()
        {
            return View();
        }
    }
}
