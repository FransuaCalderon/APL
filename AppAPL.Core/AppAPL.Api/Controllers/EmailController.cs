using AppAPL.Dto.Email;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmailController(IEmailServicio servicio, ILogger<EmailController> logger) : ControllerBase
    {
        [HttpGet("enviar-correo")]
        public async Task<ActionResult> Enviar()
        {
            var destinatarios = new List<string> { "cliente1@gmail.com", "cliente2@gmail.com" };
            var copias = new List<string> { "jefe@miempresa.com" };
            var copiasOcultas = new List<string> { "auditoria@miempresa.com" };


            var datos = new Dictionary<string, string>
                    {
                    { "Nombre", "Daniel" },
                    { "FechaRegistro", DateTime.Now.ToString("dd/MM/yyyy") }
                    };

            await servicio.SendEmailAsync(
            toList: destinatarios,
            subject: "Bienvenido a Mi Aplicación ",
            templateName: "CorreoBienvenida.html",
            placeholders: datos,
            ccList: copias,
            bccList: copiasOcultas
            );

            return Ok("Correo enviado con CC y BCC ✅");
        }

        [HttpPost("consultar-datos_correo")]
        public async Task<ActionResult<List<DatosCorreoDTO>>> ObtenerDatosCorreo(ConsultarDatosCorreoRequest request)
        {
            var listaDatos = await servicio.ObtenerDatosCorreo(request);

            return listaDatos.ToList();
        }



    }
}
