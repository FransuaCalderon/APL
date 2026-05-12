// Controllers/FondoController.cs

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace AppAPL.Portal.Controllers
{
    public class FondoController : Controller
    {
        public IActionResult CrearFondo()
        {
            var usuario = HttpContext.Session.GetString("Usuario");

            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;
            return View();
        }

        public IActionResult AprobarFondo()
        {
            var usuario = HttpContext.Session.GetString("Usuario");

            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;

            return View();
        }

        public IActionResult ModificarFondo()
        {
            var usuario = HttpContext.Session.GetString("Usuario");

            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;

            return View();
        }

        public IActionResult InactivarFondo()
        {
            var usuario = HttpContext.Session.GetString("Usuario");

            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;

            return View();
        }

        public IActionResult ConsultarFondo()
        {
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