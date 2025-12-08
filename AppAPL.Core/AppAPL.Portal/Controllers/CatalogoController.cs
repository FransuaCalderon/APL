using AppAPL.Portal.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers
{
    public class CatalogoController : Controller
    {
        public CatalogoController(CatalogoApiClient catalogoApiClient)
        {
           
        }
        public async Task<IActionResult> Index()
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
    }
}
