// Controllers/LoginController.cs

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace AppAPL.Portal.Controllers
{
    public class LoginController (IConfiguration config) : Controller
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

            // Leemos el emisor válido y lo pasamos a la vista
            ViewBag.EmisorIdValido = config["Apigee:EmisorID"] ?? "0";

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

        // ESTE MÉTODO RECIBE LOS DATOS RECOLECTADOS POR AJAX TRAS LAS VALIDACIONES
        [HttpPost]
        public IActionResult EstablecerSesionLegada(string nombreUsuario, string accesos, string usuarioAprobado)
        {
            if (string.IsNullOrEmpty(nombreUsuario))
            {
                return BadRequest("Nombre de usuario inválido");
            }

            // 1. Guardar el nombre del usuario en sesión
            HttpContext.Session.SetString("Usuario", nombreUsuario);
            HttpContext.Session.SetString("usuarioAprobado", usuarioAprobado);

            // 2. Guardar la estructura de accesos/permisos en sesión
            if (!string.IsNullOrEmpty(accesos))
            {
                HttpContext.Session.SetString("Accesos", accesos);
                Console.WriteLine("🔑 Permisos y accesos del usuario cargados exitosamente en memoria.");
            }
            else
            {
                HttpContext.Session.SetString("Accesos", "[]"); // Inicializador vacío por seguridad
            }

            Console.WriteLine($"✅ Login completo. Datos almacenados para: {nombreUsuario}");

            return Ok();
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


        public IActionResult Auth()
        {
            return View();
        }
    }
}