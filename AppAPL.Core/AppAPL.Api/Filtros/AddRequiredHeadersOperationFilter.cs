using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace AppAPL.Api.Filtros
{
    public class AddRequiredHeadersOperationFilter: IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            operation.Parameters ??= new List<OpenApiParameter>();

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "usuario",
                In = ParameterLocation.Header,
                Required = true,
                Schema = new OpenApiSchema { Type = "string" },
                Description = "Usuario que realiza la solicitud"
            });

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "idopcion",
                In = ParameterLocation.Header,
                Required = true,
                Schema = new OpenApiSchema { Type = "integer", Format = "int32" },
                Description = "Identificador de la opción (entero mayor a 0)"
            });
        }
    }
}
