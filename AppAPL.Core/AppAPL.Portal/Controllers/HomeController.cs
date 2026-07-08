// Controllers/HomeController.cs

using System.Diagnostics;
using AppWebAPL.Models;
using Microsoft.AspNetCore.Mvc;

namespace AppWebAPL.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly IConfiguration config;

        public HomeController(ILogger<HomeController> logger, IConfiguration config)
        {
            _logger = logger;
            this.config = config;
        }

        public IActionResult Index()
        {
            var usuario = HttpContext.Session.GetString("Usuario");

            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            // 2. Extraemos los accesos de la memoria
            string? jsonAccesos = HttpContext.Session.GetString("Accesos");
            string? usuarioAprobado = HttpContext.Session.GetString("usuarioAprobado");

            ViewBag.UsuarioActual = usuario;
            ViewBag.AccesosJson = jsonAccesos;
            ViewBag.usuarioAprobadoJson = usuarioAprobado;

            // Leer del appsettings y mandarlo al ViewBag
            ViewBag.ModuloFiltroId = config["Apigee:ModuloFiltroId"];
            

            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
