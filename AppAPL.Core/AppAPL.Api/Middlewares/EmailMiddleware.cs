using AppAPL.Api.Attributes;

namespace AppAPL.Api.Middlewares
{
    public class EmailMiddleware(RequestDelegate next, ILogger<EmailMiddleware> logger, IServiceProvider serviceProvider)
    {
        public async Task InvokeAsync(HttpContext context)
        {

            // Obtenemos el endpoint actual (la acción del controlador)
            var endpoint = context.GetEndpoint();

            // Buscamos el atributo personalizado
            var tieneAtributo = endpoint?.Metadata.GetMetadata<EmailAttribute>() != null;

            if (tieneAtributo)
            {
                // 👇 Aquí pones la lógica que debe ejecutarse solo en controladores con el atributo
                logger.LogInformation("🟢 Ejecutando envio de email en endpoint: {Ruta}", context.Request.Path);

                // Aquí puedes hacer algo antes del siguiente middleware
                // (por ejemplo: validar headers, guardar logs, etc.)
            }
            else
            {
                await next(context);
                return;
            }

            var processId = Thread.CurrentThread.ManagedThreadId;
            logger.LogInformation($"------------------INICIANDO MIDDLEWARE DE EMAIL [hilo: {processId}]----------------");

            await next(context);

            if (tieneAtributo && context.Response.StatusCode >= 200 && context.Response.StatusCode < 300)
            {
                // Aquí puedes ejecutar algo después del pipeline, si lo deseas
                logger.LogInformation("🔵 Finalizó envio de email en: {Ruta}", context.Request.Path);
            }

            logger.LogInformation($"------------------TERMINANDO MIDDLEWARE DE EMAIL [hilo: {processId}] ------------------");
        }
    }
}
