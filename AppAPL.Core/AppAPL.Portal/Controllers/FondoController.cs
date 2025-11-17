using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http; // ← importante para HttpContext.Session

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

        public async Task<IActionResult> ModificarFondo()
        {
            return View();
        }

        public async Task<IActionResult> InactivarFondo()
        {
            return View();
        }

        public async Task<IActionResult> ConsultarFondo()
        {
            return View();
        }
    }
}
