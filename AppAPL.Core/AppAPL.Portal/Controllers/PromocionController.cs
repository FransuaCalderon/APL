// Controllers/PromocionController.cs

using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers
{
    public class PromocionController(IConfiguration configuration) : Controller
    {
        public IActionResult CrearPromocion()
        {
            var usuario = HttpContext.Session.GetString("Usuario");

            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;

            var maxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");

            ViewBag.MaximoTamanoMB = maxMB;

            var extensiones = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>() ?? Array.Empty<string>();
            ViewBag.ExtensionesPermitidas = string.Join(",", extensiones);

            return View();
        }

        public IActionResult AprobarPromocion()
        {
            var usuario = HttpContext.Session.GetString("Usuario");

            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;

            var maxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");
            ViewBag.MaximoTamanoMB = maxMB;

            var extensiones = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>() ?? Array.Empty<string>();
            ViewBag.ExtensionesPermitidas = string.Join(",", extensiones);

            return View();
        }

        public IActionResult ConsultarPromocion()
        {
            var usuario = HttpContext.Session.GetString("Usuario");

            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;

            var maxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");
            ViewBag.MaximoTamanoMB = maxMB;

            var extensiones = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>() ?? Array.Empty<string>();
            ViewBag.ExtensionesPermitidas = string.Join(",", extensiones);

            return View();
        }

        public IActionResult InactivarPromocion()
        {
            var usuario = HttpContext.Session.GetString("Usuario");

            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;

            var maxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");
            ViewBag.MaximoTamanoMB = maxMB;

            var extensiones = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>() ?? Array.Empty<string>();
            ViewBag.ExtensionesPermitidas = string.Join(",", extensiones);

            return View();
        }

        public IActionResult ModificarPromocion()
        {
            var usuario = HttpContext.Session.GetString("Usuario");

            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;

            var maxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");
            ViewBag.MaximoTamanoMB = maxMB;

            var extensiones = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>() ?? Array.Empty<string>();
            ViewBag.ExtensionesPermitidas = string.Join(",", extensiones);

            return View();
        }

        public IActionResult Liquidacion()
        {
            var usuario = HttpContext.Session.GetString("Usuario");

            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            ViewBag.UsuarioActual = usuario;

            var maxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");
            ViewBag.MaximoTamanoMB = maxMB;

            var extensiones = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>() ?? Array.Empty<string>();
            ViewBag.ExtensionesPermitidas = string.Join(",", extensiones);

            return View();
        }
    }
}

// Autor: JEAN FRANCOIS CALDERON VEAS | Empresa: BMTECSA | Proyecto: SOFTWARE APL