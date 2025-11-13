using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Api.Handlers;
using AppAPL.Api.Handlers.Interfaces;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Mvc.Controllers;
using static AppAPL.Api.Attributes.EmailAttribute;

namespace AppAPL.Api.Middlewares
{
    public class EmailMiddleware (RequestDelegate next, ILogger<EmailMiddleware> logger)
    {
        public async Task InvokeAsync(HttpContext context, IServiceProvider serviceProvider)
        {
            var metodo = context.Request.Method;
            var path = context.Request.Path;
            var processId = Thread.CurrentThread.ManagedThreadId;

            logger.LogInformation("🟢 Ejecutando auditoría en endpoint: {Ruta}", context.Request.Path);
            logger.LogInformation($"------------------INICIANDO MIDDLEWARE DE EMAIL [hilo: {processId}]----------------");

            // 🔹 Leer el body del request antes de continuar
            context.Request.EnableBuffering();
            string bodyString = string.Empty;

            if (context.Request.ContentLength > 0)
            {
                using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
                bodyString = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;
            }

            // 🔹 Continuar la ejecución normal del pipeline
            await next(context);

            // 🔹 Obtener el atributo [Email] del endpoint
            var endpoint = context.GetEndpoint();
            var emailAttr = endpoint?.Metadata.GetMetadata<EmailAttribute>();
            if (emailAttr == null)
                return;

            // 🔹 Obtener el nombre del controlador
            var descriptor = endpoint?.Metadata.GetMetadata<ControllerActionDescriptor>();
            var controllerName = descriptor?.ControllerName?.ToLower() ?? string.Empty;

            logger.LogInformation($"📧 [Middleware] Procesando correo para controlador={controllerName}, Entidad={emailAttr.Entidad}, TipoProceso={emailAttr.TipoProceso}");

            // 🔹 Resolver handler según el controlador
            object? handler = controllerName switch
            {
                "fondo" => serviceProvider.GetService<IFondosEmailHandler>(),
                "acuerdos" => serviceProvider.GetService<IAcuerdosEmailHandler>(),
                //"promocion" => serviceProvider.GetService<IPromocionEmailHandler>(),
                _ => null
            };

            if (handler == null)
            {
                logger.LogWarning($"⚠️ [Middleware] No se encontró handler para el controlador '{controllerName}'.");
                return;
            }

            // suponiendo que emailAttr.TipoProceso es TipoProceso (no string)
            var tipoProcesoEnum = emailAttr.TipoProceso;

            switch (handler)
            {
                case IFondosEmailHandler fondosHandler:
                    await fondosHandler.HandleAsync(emailAttr.Entidad, tipoProcesoEnum, bodyString);
                    break;
                /*
                case IAcuerdosEmailHandler acuerdosHandler:
                    await acuerdosHandler.HandleAsync(emailAttr.Entidad, tipoProcesoEnum, bodyString);
                    break;

                case IPromocionEmailHandler promoHandler:
                    await promoHandler.HandleAsync(emailAttr.Entidad, tipoProcesoEnum, bodyString);
                    break;*/
            }


            logger.LogInformation("🔵 Finalizó auditoría en: {Ruta}", context.Request.Path);
            logger.LogInformation($"------------------TERMINANDO MIDDLEWARE DE EMAIL [hilo: {processId}] ------------------");
        }

    }
}
