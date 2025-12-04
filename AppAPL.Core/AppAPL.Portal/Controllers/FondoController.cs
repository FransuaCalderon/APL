using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http; // ← importante para HttpContext.Session

namespace AppWebAPL.Controllers
{
    public class FondoController : Controller
    {
        public async Task<IActionResult> CrearFondo()
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
            // 1️⃣ Leer el usuario desde la sesión
            var usuario = HttpContext.Session.GetString("Usuario"); // Asegúrate de que la clave "Usuario" contenga datos válidos.

            // 2️⃣ Si no hay usuario, lo mandas al login (Este es tu guardrail)
            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            // 3️⃣ Lo pasas a la vista (¡Esto debe contener el valor real!)
            ViewBag.UsuarioActual = usuario;

            return View();
        }

        public async Task<IActionResult> InactivarFondo()
        {
            // 1️⃣ Leer el usuario desde la sesión
            var usuario = HttpContext.Session.GetString("Usuario"); // Asegúrate de que la clave "Usuario" contenga datos válidos.

            // 2️⃣ Si no hay usuario, lo mandas al login (Este es tu guardrail)
            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            // 3️⃣ Lo pasas a la vista (¡Esto debe contener el valor real!)
            ViewBag.UsuarioActual = usuario;

            return View();
        }

        public async Task<IActionResult> ConsultarFondo()
        {
            // 1️⃣ Leer el usuario desde la sesión
            var usuario = HttpContext.Session.GetString("Usuario"); // Asegúrate de que la clave "Usuario" contenga datos válidos.

            // 2️⃣ Si no hay usuario, lo mandas al login (Este es tu guardrail)
            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            // 3️⃣ Lo pasas a la vista (¡Esto debe contener el valor real!)
            ViewBag.UsuarioActual = usuario;

            return View();
        }
    }
}
