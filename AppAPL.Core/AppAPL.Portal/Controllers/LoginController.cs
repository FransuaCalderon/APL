using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http; // Necesario para HttpContext.Session

namespace AppAPL.Portal.Controllers
{
    public class LoginController : Controller
    {
        // --------------------------------------------------------
        // MÉTODO 1: [HttpGet] - RENDERIZA LA VISTA DE LOGIN
        // --------------------------------------------------------
        [HttpGet]
        public IActionResult Login()
        {
            // Opcional: Si ya hay sesión activa, redirigir al Home.
            if (!string.IsNullOrEmpty(HttpContext.Session.GetString("Usuario")))
            {
                return RedirectToAction("Index", "Home");
            }

            return View(); // Renderiza Login.cshtml
        }

        // --------------------------------------------------------
        // MÉTODO 2: [HttpPost] - PROCESA LA CAPTURA DEL USUARIO DEL FORMULARIO
        // --------------------------------------------------------
        [HttpPost]
        public IActionResult Login(string Usuario, string Clave)
        {
            // **Paso 1: Captura el valor del formulario (Usuario y Clave) automáticamente**
            // ASP.NET Core MVC enlaza automáticamente los inputs del formulario 
            // con los parámetros 'Usuario' y 'Clave' de este método.

            // Simulación de validación (usando la clave 'admin' como mock-up)
            const string claveValida = "admin";

            if (string.IsNullOrWhiteSpace(Usuario) || string.IsNullOrWhiteSpace(Clave))
            {
                ViewData["Error"] = "Por favor ingrese usuario y contraseña.";
                return View();
            }

            if (Clave == claveValida)
            {
                // **Paso 2: Persistencia del Usuario Capturado**
                // Guardar el nombre de usuario capturado en la Sesión del servidor.
                HttpContext.Session.SetString("Usuario", Usuario);

                Console.WriteLine($"✅ Login exitoso. Usuario capturado y guardado en sesión: {Usuario}");

                // **Paso 3: Redirección al Home**
                // Esto inicia una nueva petición HTTP (GET) donde el HomeController leerá la sesión.
                return RedirectToAction("Index", "Home");
            }
            else
            {
                ViewData["Error"] = "Contraseña incorrecta.";
                return View();
            }
        }

        // --------------------------------------------------------
        // MÉTODO 3: Logout - Cerrar sesión
        // --------------------------------------------------------
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            Console.WriteLine("🚪 Usuario cerró sesión");
            return RedirectToAction("Login");
        }
    }
}