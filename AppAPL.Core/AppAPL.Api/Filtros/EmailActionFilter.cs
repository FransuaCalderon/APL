using System.Text.Json;
using AppAPL.Api.Attributes;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AppAPL.Api.Filtros
{
    /*
    public class EmailActionFilter (ILogger<EmailActionFilter> logger) : IAsyncActionFilter
    {
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var descriptor = context.ActionDescriptor as ControllerActionDescriptor;
            var emailAttribute = descriptor?.MethodInfo
                .GetCustomAttributes(typeof(EmailAttribute), false)
                .Cast<EmailAttribute>()
                .FirstOrDefault();

            // Si el endpoint no tiene el atributo [Email], no hacemos nada
            if (emailAttribute == null)
            {
                await next();
                return;
            }

            // Leer el cuerpo del request (para obtener el campo configurado en el atributo)
            context.HttpContext.Request.EnableBuffering();

            using var reader = new StreamReader(context.HttpContext.Request.Body, leaveOpen: true);
            var bodyString = await reader.ReadToEndAsync();
            context.HttpContext.Request.Body.Position = 0;
            //logger.LogInformation($"bodyString: {bodyString}");
            // Deserializar a un diccionario dinámico
            var jsonBody = JsonSerializer.Deserialize<Dictionary<string, object>>(bodyString ?? "{}");

            // Obtener el valor del campo indicado en el atributo
            string? idDocumento = null;
            if (!string.IsNullOrEmpty(emailAttribute.BodyField) && jsonBody != null)
            {
                jsonBody.TryGetValue(emailAttribute.BodyField, out var valorCampo);
                idDocumento = valorCampo?.ToString();
            }

            // Guardamos los datos para usarlos después del next()
            context.HttpContext.Items["EmailEntidad"] = emailAttribute.Entidad;
            context.HttpContext.Items["EmailTipoProceso"] = emailAttribute.TipoProceso;
            context.HttpContext.Items["EmailIdDocumento"] = idDocumento;

            // Ejecutar el controlador
            var resultContext = await next(); 

            // Si la acción terminó correctamente, podemos aquí invocar el handler o middleware de correo
            if (resultContext.Exception == null && resultContext.Result is ObjectResult)
            {
                // Puedes disparar el envío de correo aquí o delegarlo al middleware posterior
                // Ejemplo:
                // var emailHandler = context.HttpContext.RequestServices.GetRequiredService<IEmailHandlerFondos>();
                // await emailHandler.HandleAsync(emailAttribute.Entidad, emailAttribute.TipoProceso, idDocumento);
            }
        }
    }*/
}
