using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http; // ← importante para HttpContext.Session

namespace AppAPL.Portal.Controllers
{
    public class ParametrizacionController(ILogger<ParametrizacionController> logger) : Controller
    {
        public async Task<IActionResult> Configuracion()
        {
            logger.LogInformation("Configuracion vista");
            // 1️⃣ Leer el usuario desde la sesión
            var usuario = HttpContext.Session.GetString("Usuario");

            // 2️⃣ Si no hay usuario, lo mandas al login
            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            // 3️⃣ Lo pasas a la vista
            ViewBag.UsuarioActual = usuario;

            return View();
        }
    }
}
