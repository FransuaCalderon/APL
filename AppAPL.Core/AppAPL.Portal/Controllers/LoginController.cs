using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Portal.Controllers // Asegúrate que este namespace sea correcto
{
    public class LoginController : Controller
    {
        // --------------------------------------------------------
        // MÉTODO 1: [HttpGet] - RESPONSABLE DE RENDERIZAR LA VISTA
        // --------------------------------------------------------
        // Este método se ejecuta cuando navegas a la ruta base y tu Program.cs
        // te redirige a Login/Login (solicitud GET).
        [HttpGet]
        public IActionResult Login()
        {
            // Simplemente retorna la vista por convención: Views/Login/Login.cshtml
            return View();
        }

        // --------------------------------------------------------
        // MÉTODO 2: [HttpPost] - PROCESA LA VALIDACIÓN DEL FORMULARIO
        // --------------------------------------------------------
        // Este método se ejecuta cuando el usuario presiona el botón "Ingresar"
        [HttpPost]
        public IActionResult Login(string Usuario, string Clave)
        {
            // Validación de prueba para maquetado: admin / admin
            const string usuarioValido = "admin";
            const string claveValida = "admin";

            if (Usuario == usuarioValido && Clave == claveValida)
            {
                // Éxito: Redirigir a la página principal (Home/Index)
                // (Necesitas una página de Home válida que use tu _Layout.cshtml)
                return RedirectToAction("Index", "Home");
            }
            else
            {
                // Fallo: Añadir mensaje de error y volver a renderizar la vista de Login
                ViewData["Error"] = "Usuario o contraseña incorrectos.";
                return View();
            }
        }
    }
}