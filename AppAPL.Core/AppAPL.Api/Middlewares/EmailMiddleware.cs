using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Api.Handlers;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
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

            logger.LogInformation("🟢 Ejecutando auditoría en endpoint: {Ruta}", context.Request.Path);
            logger.LogInformation($"------------------INICIANDO MIDDLEWARE DE EMAIL [hilo: {processId}]----------------");

            // Primero deja pasar la solicitud
            await next(context);

            // Recuperar datos que dejó el filtro EmailActionFilter
            var entidad = context.Items["EmailEntidad"] as string;
            var tipoProceso = context.Items["EmailTipoProceso"] as string;
            var idDocumento = context.Items["EmailIdDocumento"] as string;


            if (string.IsNullOrEmpty(entidad) || string.IsNullOrEmpty(tipoProceso))
                return; // Si no hay datos, no se hace nada

            logger.LogInformation($"📨 Ejecutando envío de correo para entidad: {entidad}, tipoProceso: {tipoProceso}, idDocumento: {idDocumento}");


            switch (entidad.ToUpperInvariant())
            {
                case "ENTFONDO":
                    var fondosHandler = context.RequestServices.GetService<FondosEmailHandler>();
                    if (fondosHandler != null)
                        await fondosHandler.HandleAsync(entidad, tipoProceso, idDocumento);
                    break;

                case "ENTACUERDO":
                    var acuerdosHandler = context.RequestServices.GetService<AcuerdosEmailHandler>();
                    if (acuerdosHandler != null)
                        await acuerdosHandler.HandleAsync(entidad, tipoProceso, idDocumento);
                    break;
                
                    /*
                case "PROMOCION":
                    var promoHandler = context.RequestServices.GetService<IEmailHandlerPromocion>();
                    if (promoHandler != null)
                        await promoHandler.HandleAsync(entidad, tipoProceso, idDocumento);
                    break;*/

                default:
                    logger.LogWarning($"⚠️ No se encontró un handler de correo para la entidad: {entidad}");
                    break;
            }


            logger.LogInformation("🔵 Finalizó auditoría en: {Ruta}", context.Request.Path);
            logger.LogInformation($"------------------TERMINANDO MIDDLEWARE DE EMAIL [hilo: {processId}] ------------------");
        }

    }
}
