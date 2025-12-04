using System.Diagnostics;
using AppWebAPL.Models;
using Microsoft.AspNetCore.Mvc;

namespace AppWebAPL.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            // 1?? Leer el usuario desde la sesión
            var usuario = HttpContext.Session.GetString("Usuario");

            // 2?? Si no hay usuario, lo mandas al login
            if (string.IsNullOrEmpty(usuario))
            {
                return RedirectToAction("Login", "Login");
            }

            // 3?? Lo pasas a la vista
            ViewBag.UsuarioActual = usuario;
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
