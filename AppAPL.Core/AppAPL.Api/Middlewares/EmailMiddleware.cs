using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
using static AppAPL.Api.Attributes.EmailAttribute;

namespace AppAPL.Api.Middlewares
{
    public class EmailMiddleware (RequestDelegate next, ILogger<EmailMiddleware> logger, IServiceProvider serviceProvider)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            var metodo = context.Request.Method;
            var path = context.Request.Path;
            var processId = Thread.CurrentThread.ManagedThreadId;

           
            var identidad = context.Request.Headers.TryGetValue("identidad", out var h6) ? h6.ToString() : "0";
            var idtipoproceso = context.Request.Headers.TryGetValue("idtipoproceso", out var h7) ? h7.ToString() : "0";


            // Obtenemos el endpoint actual (la acción del controlador)
            var endpoint = context.GetEndpoint();

            // Buscamos el atributo personalizado
            var atributo = endpoint?.Metadata.GetMetadata<EmailAttribute>();

            // validamos si el endpoint tiene el atributo de aprobacion, si no tiene el atributo, salimos del middleware y no ejecutamos aprobacion ni envio de mail

            if (atributo is null)
            {
                await next(context);
                return;
            }

            logger.LogInformation("🟢 Ejecutando auditoría en endpoint: {Ruta}", context.Request.Path);

            
            logger.LogInformation($"------------------INICIANDO MIDDLEWARE DE EMAIL [hilo: {processId}]----------------");




            //--------leer body del request
            //------------------------------------------------------
            string requestBody = "";
            
            context.Request.EnableBuffering();

            using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
            requestBody = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;

            logger.LogInformation("Request body en JSON emailmiddleware: {Body}", requestBody);
            
            //-----------------------------------------------------------------------------




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

            //enviar correo

            // según el enum, decide qué DTO deserializar
            logger.LogInformation("✅ Request exitoso. Intentando mapear body al DTO...");

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true // muy importante
            };

            object? dto = atributo.TipoAccion switch
            {
                TipoAccionEmail.Creacion => JsonSerializer.Deserialize<CrearFondoRequest>(requestBody, options),
                
                TipoAccionEmail.Aprobacion => JsonSerializer.Deserialize<ActualizarFondoRequest>(requestBody, options),
                _ => null
            };

            if (dto != null)
            {
                await ProcesarEnvioCorreo(atributo.TipoAccion, dto);
            }


            logger.LogInformation("🔵 Finalizó auditoría en: {Ruta}", context.Request.Path);
            logger.LogInformation($"------------------TERMINANDO MIDDLEWARE DE EMAIL [hilo: {processId}] ------------------");
        }

        private async Task ProcesarEnvioCorreo(TipoAccionEmail tipo, object dto)
        {
            using var scope = serviceProvider.CreateScope();
            var emailRepo = scope.ServiceProvider.GetRequiredService<IEmailRepositorio>();

            // ejemplo básico de cómo puedes acceder a campos del DTO
            var placeholders = new Dictionary<string, string>
            {
                { "Operacion", tipo.ToString() },
                { "Nombre", "Aprobacion Middleware" },
                { "FechaRegistro", DateTime.Now.ToString("dd/MM/yyyy HH:mm") }
            };


            switch (tipo)
            {
                case TipoAccionEmail.Creacion when dto is CrearFondoRequest crear:
                    placeholders["Nombre"] = crear.NombreUsuarioIngreso ?? "Desconocido";
                    placeholders["IdProveedor"] = crear.IdProveedor ?? "(sin motivo)";
                    break;
                    
                case TipoAccionEmail.Aprobacion when dto is ActualizarFondoRequest apro:
                    placeholders["IdProveedor"] = apro.IdProveedor ?? "(sin motivo)";
                    break;

                    // ...otros tipos
            }

            //logica para el envio de email
            var destinatarios = new List<string> { "juanzoller95@gmail.com" };
            var copias = new List<string> { "jefe@miempresa.com" };
            var copiasOcultas = new List<string> { "auditoria@miempresa.com" };

            await emailRepo.SendEmailAsync(
                toList: destinatarios,
                subject: $"Notificación: {tipo}",
                templateName: "CorreoBienvenida.html",
                placeholders: placeholders,
                ccList: copias,
                bccList: copiasOcultas
            );

            logger.LogInformation("📧 Correo enviado para operación {Tipo}", tipo);
        }

        /*
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
        }*/

    }
}
