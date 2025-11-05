using System.Diagnostics;
using System.IO;
using AppAPL.Api.Attributes;
using AppAPL.Negocio.Abstracciones;

namespace AppAPL.Api.Middlewares
{
    public class AprobacionMiddleware (RequestDelegate next, ILogger<AprobacionMiddleware> logger, IServiceProvider serviceProvider)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            var metodo = context.Request.Method;
            var path = context.Request.Path;
            var processId = Thread.CurrentThread.ManagedThreadId;


            // Obtenemos el endpoint actual (la acción del controlador)
            var endpoint = context.GetEndpoint();

            // Buscamos el atributo personalizado
            var tieneAtributo = endpoint?.Metadata.GetMetadata<AprobacionAttribute>() != null;

            // validamos si el endpoint tiene el atributo de aprobacion, si no tiene el atributo, salimos del middleware y no ejecutamos aprobacion ni envio de mail

            if (!tieneAtributo)
            {
                await next(context);
                return;
            }

            logger.LogInformation("🟢 Ejecutando auditoría en endpoint: {Ruta}", context.Request.Path);

            
            logger.LogInformation($"------------------INICIANDO MIDDLEWARE DE APROBACION [{processId}]----------------");

            await next(context);

            int status = context.Response.StatusCode;

            bool esExitoso = status >= 200 && status < 300;


            logger.LogInformation($"Codigo de estado HTTP: {status}");
            logger.LogInformation("Request => {Metodo} {Path}", metodo, path);



            if (!esExitoso)
            {
                logger.LogWarning("❌ [AprobacionMiddleware] Request fallido con código {StatusCode} en {Path}", status, path);
                return;
            }


            //aqui aplicar la logica si la respuesta fuera todo ok en rango de 200
            logger.LogInformation($"Request exitoso: {status}");


            //agregar aqui servicio y la logica para grabar en la tabla de aprobador y aprobaciones




            //enviar correo
            await this.EnviarCorreo();


            logger.LogInformation("🔵 Finalizó auditoría en: {Ruta}", context.Request.Path);
            logger.LogInformation($"------------------TERMINANDO MIDDLEWARE DE APROBACION [{processId}] ------------------");
        }


        private async Task EnviarCorreo()
        {
            //logica para el envio de email
            var destinatarios = new List<string> { "cliente1@gmail.com", "cliente2@gmail.com" };
            var copias = new List<string> { "jefe@miempresa.com" };
            var copiasOcultas = new List<string> { "auditoria@miempresa.com" };

            //parametros debe correo debe ser traidos de la base de datos
            var datos = new Dictionary<string, string>
                    {
                    { "Nombre", "Aprobacion Middleware" },
                    { "FechaRegistro", DateTime.Now.ToString("dd/MM/yyyy") }
                    };

            //logica para enviar correo electronico
            using var scope = serviceProvider.CreateScope();
            var emailServicio = scope.ServiceProvider.GetRequiredService<IEmailServicio>();


            await emailServicio.SendEmailAsync(
            toList: destinatarios,
            subject: "Bienvenido a Mi Aplicación ",
            templateName: "CorreoBienvenida.html",
            placeholders: datos,
            ccList: copias,
            bccList: copiasOcultas
            );

            logger.LogInformation("Correo de Aprobacion enviado correctamente");
        }

    }
}
