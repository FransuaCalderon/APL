using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Diagnostics;
using System.Threading.Tasks;

namespace AppAPL.Api.Filtros
{
    public class FiltroAccion : IAsyncActionFilter
    {
        private readonly ILogger<FiltroAccion> logger;
       

        public FiltroAccion(ILogger<FiltroAccion> logger)
        {
            this.logger = logger;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Obtener información de la solicitud
            var controllerName = context.ActionDescriptor.RouteValues["controller"];
            var actionName = context.ActionDescriptor.RouteValues["action"];
            var method = context.HttpContext.Request.Method;
            //var processId = Process.GetCurrentProcess().Id; // Obtener el ID del proceso
            var processId = Thread.CurrentThread.ManagedThreadId;

            // Iniciar el temporizador
            var stopwatch = Stopwatch.StartNew();

            // Loguear información antes de la acción
            logger.LogInformation($"------------------INICIANDO LA ACCION DEL ENDPOINT [hilo: {processId}]----------------");
            logger.LogInformation($"[hilo: {processId}] INICIANDO PROCESO ");
            logger.LogInformation($"[hilo: {processId}] Iniciando {method} en {controllerName}/{actionName}");

            // Ejecutar la acción
            //var resultContext = await next();
            await next();

            // Detener el temporizador
            stopwatch.Stop();

            // Loguear información después de la acción
           
            logger.LogInformation($"[hilo: {processId}] Finalizado {method} en {controllerName}/{actionName}. Tiempo: {stopwatch.ElapsedMilliseconds} ms");
            logger.LogInformation($"------------------TERMINANDO LA ACCION DEL ENDPOINT [hilo: {processId}] ------------------");
            logger.LogInformation($"[hilo: {processId}] FINALIZANDO PROCESO ");
        }

    }
}