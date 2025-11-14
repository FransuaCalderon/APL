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
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.DependencyInjection;
using static AppAPL.Api.Attributes.EmailAttribute;

namespace AppAPL.Api.Middlewares
{
    public class EmailMiddleware (RequestDelegate next, ILogger<EmailMiddleware> logger)
    {
        public async Task InvokeAsync(HttpContext context, IServiceProvider serviceProvider)
        {
            var metodo = context.Request.Method;
            //var path = context.Request.Path;
            var processId = Thread.CurrentThread.ManagedThreadId;
            // Esta es la línea clave: parametros de ruta
            
            // 🔹 Obtener el atributo [Email] del endpoint
            var endpoint = context.GetEndpoint();
            var emailAttr = endpoint?.Metadata.GetMetadata<EmailAttribute>();
            if (emailAttr == null)
            {
                await next(context);
                return;
            }
                

            // 🔹 Obtener el nombre del controlador
            var descriptor = endpoint?.Metadata.GetMetadata<ControllerActionDescriptor>();
            var controllerName = descriptor?.ControllerName?.ToLower() ?? string.Empty;



            logger.LogInformation("🟢 Ejecutando auditoría en endpoint: {Ruta}", context.Request.Path);
            logger.LogInformation($"------------------INICIANDO MIDDLEWARE DE EMAIL [hilo: {processId}]----------------");

            // 🔹 Leer el body del request antes de continuar
            context.Request.EnableBuffering();
            string requestBody = string.Empty;

            if (context.Request.ContentLength > 0)
            {
                using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
                requestBody = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;
            }


            //---------------leer body del response antes del next------------------------
            string responseBody = "";
            var originalBodyStream = context.Response.Body; // stream real
            using var memoryStream = new MemoryStream();
            context.Response.Body = memoryStream; // stream temporal
            //-------------------------------------------------------




            FondoDTO fondoAntiguo = null;
            //logica para sacar el fondo antiguo antes de modificar
            if (emailAttr.Entidad == "ENTFONDO" && emailAttr.TipoProceso == TipoProceso.Modificacion)
            {
                fondoAntiguo = await this.consultarFondoAntiguo(context.Request.RouteValues, serviceProvider);
            }

            // 🔹 Continuar la ejecución normal del pipeline
            await next(context);


            //---------------leer body del response despues del next------------------------

            // Leer el resultado del response
            memoryStream.Seek(0, SeekOrigin.Begin);
            responseBody = await new StreamReader(memoryStream).ReadToEndAsync();

            // Log
            logger.LogInformation("Response Body: {Body}", responseBody);

            // Devolver la respuesta real al cliente
            memoryStream.Seek(0, SeekOrigin.Begin);
            await memoryStream.CopyToAsync(originalBodyStream);
            context.Response.Body = originalBodyStream;

            //---------------------------------------------------------------------




            logger.LogInformation($"📧 [Middleware] Procesando correo para controlador={controllerName}, Entidad={emailAttr.Entidad}, TipoProceso={emailAttr.TipoProceso}");

            

            // 🔹 Resolver handler según el controlador
            object? handler = controllerName switch
            {
                "fondo" => serviceProvider.GetService<IFondosEmailHandler>(),
                "acuerdo" => serviceProvider.GetService<IAcuerdosEmailHandler>(),
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
                    await fondosHandler.HandleAsync(emailAttr.Entidad, tipoProcesoEnum, requestBody, fondoAntiguo, responseBody);
                    break;
                /*
                case IAcuerdosEmailHandler acuerdosHandler:
                    await acuerdosHandler.HandleAsync(emailAttr.Entidad, tipoProcesoEnum, requestBody);
                    break;

                case IPromocionEmailHandler promoHandler:
                    await promoHandler.HandleAsync(emailAttr.Entidad, tipoProcesoEnum, requestBody);
                    break;*/
            }


            logger.LogInformation("🔵 Finalizó auditoría en: {Ruta}", context.Request.Path);
            logger.LogInformation($"------------------TERMINANDO MIDDLEWARE DE EMAIL [hilo: {processId}] ------------------");
        }

        
        private async Task<FondoDTO> consultarFondoAntiguo(RouteValueDictionary routeValues, IServiceProvider serviceProvider)
        {
            
            if (routeValues.TryGetValue("idFondo", out object idValue))
            {
                string idComoString = idValue?.ToString();

                if (!string.IsNullOrEmpty(idComoString))
                {
                    logger.LogInformation($"[MiMiddleware] Se encontró el parámetro 'idFondo': {idComoString}");

                    var servicioFondo = serviceProvider.GetService<IFondoServicio>();
                    return await servicioFondo.ObtenerPorIdAsync(Convert.ToInt32(idComoString));
                }
            }

            logger.LogInformation($"No se encontro parametro de ruta 'idFondo'");
            return null;
        }
    }
}
