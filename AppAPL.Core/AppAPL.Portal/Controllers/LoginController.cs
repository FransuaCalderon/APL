using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers
{
    public class LoginController : Controller
    {
        // --------------------------------------------------------
        // MÉTODO 1: [HttpGet] - RESPONSABLE DE RENDERIZAR LA VISTA
        // --------------------------------------------------------
        [HttpGet]
        public IActionResult Login()
        {
            // Si ya hay sesión activa, redirigir directamente al Home
            if (!string.IsNullOrEmpty(HttpContext.Session.GetString("Usuario")))
            {
                return RedirectToAction("Index", "Home");
            }

            return View();
        }

        // --------------------------------------------------------
        // MÉTODO 2: [HttpPost] - PROCESA LA VALIDACIÓN DEL FORMULARIO
        // --------------------------------------------------------
        [HttpPost]
        public IActionResult Login(string Usuario, string Clave)
        {
            // ✅ VALIDACIÓN: Cualquier usuario + clave "admin"
            const string claveValida = "admin";

            // Verificar que los campos no estén vacíos
            if (string.IsNullOrWhiteSpace(Usuario) || string.IsNullOrWhiteSpace(Clave))
            {
                ViewData["Error"] = "Por favor ingrese usuario y contraseña.";
                return View();
            }

            // ✅ SOLO valida la clave, el usuario puede ser cualquiera
            if (Clave == claveValida)
            {
                // ✅ Guardar el usuario en sesión
                HttpContext.Session.SetString("Usuario", Usuario);

                // Log para debugging (opcional)
                Console.WriteLine($"✅ Login exitoso - Usuario: {Usuario}");

                // Redirigir a la página principal
                return RedirectToAction("Index", "Home");
            }
            else
            {
                // Fallo: Contraseña incorrecta
                ViewData["Error"] = "Contraseña incorrecta.";
                return View();
            }
        }

        // --------------------------------------------------------
        // MÉTODO 3: Logout - Cerrar sesión
        // --------------------------------------------------------
        public IActionResult Logout()
        {
            // Limpiar la sesión
            HttpContext.Session.Clear();

            Console.WriteLine("🚪 Usuario cerró sesión");

            return RedirectToAction("Login");
        }
    }
}