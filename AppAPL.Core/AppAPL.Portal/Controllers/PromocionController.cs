using Microsoft.AspNetCore.Mvc;

namespace AppWebAPL.Controllers
{
    public class PromocionController(IConfiguration configuration) : Controller
    {
        public IActionResult CrearPromocion()
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

            // Leemos el valor del appsettings.json
            var maxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");

            // Lo pasamos a la vista
            ViewBag.MaximoTamanoMB = maxMB;


            // Leer extensiones y unirlas: ".pdf,.xls,.xlsx"
            var extensiones = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>();
            ViewBag.ExtensionesPermitidas = string.Join(",", extensiones);

            return View();
        }

        public IActionResult AprobarPromocion()
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

            // Leemos el valor del appsettings.json
            var maxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");

            // Lo pasamos a la vista
            ViewBag.MaximoTamanoMB = maxMB;


            // Leer extensiones y unirlas: ".pdf,.xls,.xlsx"
            var extensiones = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>();
            ViewBag.ExtensionesPermitidas = string.Join(",", extensiones);

            return View();
        }

        public IActionResult ConsultarPromocion()
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

            // Leemos el valor del appsettings.json
            var maxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");

            // Lo pasamos a la vista
            ViewBag.MaximoTamanoMB = maxMB;


            // Leer extensiones y unirlas: ".pdf,.xls,.xlsx"
            var extensiones = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>();
            ViewBag.ExtensionesPermitidas = string.Join(",", extensiones);

            return View();
        }

        public IActionResult InactivarPromocion()
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

            // Leemos el valor del appsettings.json
            var maxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");

            // Lo pasamos a la vista
            ViewBag.MaximoTamanoMB = maxMB;


            // Leer extensiones y unirlas: ".pdf,.xls,.xlsx"
            var extensiones = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>();
            ViewBag.ExtensionesPermitidas = string.Join(",", extensiones);

            return View();
        }

        public IActionResult ModificarPromocion()
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

            // Leemos el valor del appsettings.json
            var maxMB = configuration.GetValue<int>("ConfiguracionArchivos:MaximoTamanoMB");

            // Lo pasamos a la vista
            ViewBag.MaximoTamanoMB = maxMB;


            // Leer extensiones y unirlas: ".pdf,.xls,.xlsx"
            var extensiones = configuration.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<string[]>();
            ViewBag.ExtensionesPermitidas = string.Join(",", extensiones);

            return View();
        }
    }
}
