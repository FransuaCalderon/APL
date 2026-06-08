// Controllers/ParametrizacionController.cs

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace AppAPL.Portal.Controllers
{
    public class ParametrizacionController(ILogger<ParametrizacionController> logger) : Controller
    {
        public IActionResult Configuracion()
        {
            logger.LogInformation("Configuracion vista");
            var usuario = HttpContext.Session.GetString("Usuario");
            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;
            return View();
        }


        public IActionResult Aprobadores()
        {
            logger.LogInformation("Configuracion vista");
            var usuario = HttpContext.Session.GetString("Usuario");
            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;
            return View();
        }
    }
}