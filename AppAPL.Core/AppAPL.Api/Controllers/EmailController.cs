using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmailController(IEmailServicio servicio, ILogger<EmailController> logger) : ControllerBase
    {
        [HttpGet("/enviar-correo")]
        public async Task<ActionResult> Enviar()
        {
            var datos = new Dictionary<string, string>
                    {
                    { "Nombre", "Jean" },
                    { "FechaRegistro", DateTime.Now.ToString("dd/MM/yyyy") }
                    };

            await servicio.SendEmailAsync(
            to: "calderonfransua@gmail.com",
            subject: "Bienvenido a Mi Aplicación ",
            templateName: "CorreoBienvenida.html",
            placeholders: datos
            );

            return Ok("Correo enviado exitosamente");
        }
    }
}
