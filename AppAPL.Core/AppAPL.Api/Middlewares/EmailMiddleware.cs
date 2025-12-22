using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Api.Handlers;
using AppAPL.Api.Handlers.Interfaces;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.Json;
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

            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

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
            BandConsAcuerdoPorIDDTO acuerdoAntiguo = null;
            //logica para sacar el fondo antiguo antes de modificar
            if (emailAttr.Entidad == "ENTFONDO" && emailAttr.TipoProceso == TipoProceso.Modificacion)
            {
                //context.Request.RouteValues
                fondoAntiguo = await ConsultarEntidadAntiguaAsync<FondoDTO, IFondoServicio, object>(
                    context,
                    "idFondo",
                    serviceProvider,
                    null,
                    (svc, id) => svc.ObtenerPorIdAsync(id));
            }
            
            if (emailAttr.Entidad == "ENTACUERDO" && emailAttr.TipoProceso == TipoProceso.Modificacion)
            {
                //var reqModificacion = JsonSerializer.Deserialize<ActualizarAcuerdoDTO>(requestBody, jsonOptions);

                acuerdoAntiguo = await ConsultarEntidadAntiguaAsync<BandConsAcuerdoPorIDDTO, IAcuerdoServicio, ActualizarAcuerdoDTO>(
                context,
                "idAcuerdo",
                serviceProvider,
                dto => dto.IdAcuerdo, // <--- Aquí le dices qué propiedad del DTO es el ID
                (svc, id) => svc.ObtenerBandejaConsultaPorId(id));
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


            int status = context.Response.StatusCode;
            bool esExitoso = status >= 200 && status < 300;

            if (!esExitoso)
            {
                logger.LogInformation($"el status no fue exitoso: {status}");
                return;
            }

            logger.LogInformation($"[EmailMiddleware] Procesando correo para controlador={controllerName}, Entidad={emailAttr.Entidad}, TipoProceso={emailAttr.TipoProceso}");

            

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
                logger.LogWarning($"⚠️ [EmailMiddleware] No se encontró handler para el controlador '{controllerName}'.");
                return;
            }

            // suponiendo que emailAttr.TipoProceso es TipoProceso (no string)
            var tipoProcesoEnum = emailAttr.TipoProceso;

            switch (handler)
            {
                case IFondosEmailHandler fondosHandler:
                    await fondosHandler.HandleAsync(emailAttr.Entidad, tipoProcesoEnum, requestBody, fondoAntiguo, responseBody);
                    break;
                
                case IAcuerdosEmailHandler acuerdosHandler:
                    await acuerdosHandler.HandleAsync(emailAttr.Entidad, tipoProcesoEnum, requestBody, acuerdoAntiguo, responseBody);
                    break;
               
            }


            logger.LogInformation("🔵 Finalizó auditoría en: {Ruta}", context.Request.Path);
            logger.LogInformation($"------------------TERMINANDO MIDDLEWARE DE EMAIL [hilo: {processId}] ------------------");
        }

        /*
        private async Task<FondoDTO> consultarFondoAntiguo(RouteValueDictionary routeValues, IServiceProvider serviceProvider)
        {
            
            if (routeValues.TryGetValue("idFondo", out object idValue))
            {
                string idComoString = idValue?.ToString();

                if (!string.IsNullOrEmpty(idComoString))
                {
                    logger.LogInformation($"[EmailMiddleware] Se encontró el parámetro 'idFondo': {idComoString}");

                    var servicioFondo = serviceProvider.GetService<IFondoServicio>();
                    return await servicioFondo.ObtenerPorIdAsync(Convert.ToInt32(idComoString));
                }
            }

            logger.LogInformation($"No se encontro parametro de ruta 'idFondo'");
            return null;
        }*/

        /*
        private async Task<T?> ConsultarEntidadAntiguaAsync<T, TServicio>(
        RouteValueDictionary routeValues,
        string nombreParametro,
        IServiceProvider serviceProvider,
        Func<TServicio, int, Task<T?>> metodoBusqueda)
        where T : class
        {
            if (routeValues.TryGetValue(nombreParametro, out var idValue))
            {
                var idString = idValue?.ToString();

                if (!string.IsNullOrWhiteSpace(idString) && int.TryParse(idString, out int id))
                {
                    logger.LogInformation($"[EmailMiddleware] Parámetro '{nombreParametro}' encontrado: {id}");

                    var servicio = serviceProvider.GetService<TServicio>();
                    if (servicio == null)
                    {
                        logger.LogError($"No se pudo resolver el servicio: {typeof(TServicio).Name}");
                        return null;
                    }

                    // Sin manejo de excepciones, se las dejas al filtro global
                    return await metodoBusqueda(servicio, id);
                }

                logger.LogInformation($"El parámetro '{nombreParametro}' no es un entero válido: '{idString}'");
            }
            else
            {
                logger.LogInformation($"No se encontró el parámetro de ruta '{nombreParametro}'");
            }

            return null;
        }*/

        private async Task<T?> ConsultarEntidadAntiguaAsync<T, TServicio, TBody>(
        HttpContext context,
        string nombreParametro,
        IServiceProvider serviceProvider,
        Func<TBody, int>? obtenerIdDeDto, // Ahora es opcional (?)
        Func<TServicio, int, Task<T?>> metodoBusqueda)
        where T : class
        where TBody : class
        {
            int? id = null;

            // 1. Intentar obtener de la ruta primero
            if (context.Request.RouteValues.TryGetValue(nombreParametro, out var routeVal) &&
                int.TryParse(routeVal?.ToString(), out int routeId))
            {
                id = routeId;
            }
            // 2. Solo intentar leer el Body si NO se encontró en la ruta y tenemos una función para el DTO
            else if (obtenerIdDeDto != null && context.Request.ContentLength > 0)
            {
                context.Request.EnableBuffering();
                context.Request.Body.Position = 0;

                try
                {
                    var dto = await JsonSerializer.DeserializeAsync<TBody>(context.Request.Body,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (dto != null) id = obtenerIdDeDto(dto);
                }
                catch { /* Falló la deserialización o body vacío */ }
                finally { context.Request.Body.Position = 0; }
            }

            if (id.HasValue)
            {
                var servicio = serviceProvider.GetService<TServicio>();
                return servicio != null ? await metodoBusqueda(servicio, id.Value) : null;
            }

            return null;
        }




    }
}
