using AppAPL.Api.Attributes;
using AppAPL.Api.Utilidades;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AppAPL.Api.Filtros
{
    public class FormatoRouterFilter : IResultFilter
    {
        public void OnResultExecuting(ResultExecutingContext context)
        {
            // 1. REVISAR SI EL ENDPOINT TIENE EL ATRIBUTO [SinFormatoRouter]
            var tieneAtributo = context.ActionDescriptor.EndpointMetadata
                                .Any(em => em is SinFormatoRouterAttribute);

            if (tieneAtributo) return; // Si lo tiene, salimos y no envolvemos nada

            // 2. LÓGICA DE ENVOLVIMIENTO (La que ya teníamos)
            if (context.Result is ObjectResult objectResult)
            {
                var statusCode = objectResult.StatusCode ?? 200;
                var esError = statusCode >= 400;

                if (objectResult.Value?.GetType().GetProperty("uniTransac") != null) return;

                objectResult.Value = RouterHelper.Formatear(
                    data: objectResult.Value,
                    httpCode: statusCode,
                    mensaje: esError ? "Error procesando la solicitud" : "successful",
                    esError: esError
                );
            }
        }

        public void OnResultExecuted(ResultExecutedContext context) { }
    }
}
