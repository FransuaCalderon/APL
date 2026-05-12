// Controllers/CatalogoTipoController.cs

using AppAPL.Portal.Services;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers
{
    public class CatalogoTipoController : Controller
    {
        public CatalogoTipoController()
        {

        }
        public IActionResult Index()
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