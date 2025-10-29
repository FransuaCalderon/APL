using AppAPL.Api.Attributes;
using System.Diagnostics;

namespace AppAPL.Api.Middlewares
{
    public class AprobacionMiddleware (RequestDelegate next, ILogger<AprobacionMiddleware> logger, IServiceProvider serviceProvider)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            var processId = Thread.CurrentThread.ManagedThreadId;
            logger.LogInformation($"------------------INICIANDO MIDDLEWARE DE APROBACION [{processId}]----------------");
            // Obtenemos el endpoint actual (la acción del controlador)
            var endpoint = context.GetEndpoint();

            // Buscamos el atributo personalizado
            var tieneAtributo = endpoint?.Metadata.GetMetadata<AprobacionAttribute>() != null;

            if (tieneAtributo)
            {
                // 👇 Aquí pones la lógica que debe ejecutarse solo en controladores con el atributo
                logger.LogInformation("🟢 Ejecutando auditoría en endpoint: {Ruta}", context.Request.Path);

                // Aquí puedes hacer algo antes del siguiente middleware
                // (por ejemplo: validar headers, guardar logs, etc.)
            }

            await next(context);

            if (tieneAtributo && context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)
            {
                // Aquí puedes ejecutar algo después del pipeline, si lo deseas
                logger.LogInformation("🔵 Finalizó auditoría en: {Ruta}", context.Request.Path);
            }

            logger.LogInformation($"------------------TERMINANDO MIDDLEWARE DE APROBACION [{processId}] ------------------");
        }
    }
}
