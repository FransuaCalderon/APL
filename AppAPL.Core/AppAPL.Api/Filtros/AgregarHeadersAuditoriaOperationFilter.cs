using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace AppAPL.Api.Filtros
{
    public class AgregarHeadersAuditoriaOperationFilter: IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            operation.Parameters ??= new List<OpenApiParameter>();

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "usuario",
                In = ParameterLocation.Header,
                Required = false,
                Schema = new OpenApiSchema { Type = "string" },
                Description = "Usuario que realiza la solicitud"
            });

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "idopcion",
                In = ParameterLocation.Header,
                Required = false,
                Schema = new OpenApiSchema { Type = "integer", Format = "int32" },
                Description = "Identificador de la opción (entero mayor a 0)"
            });

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "idcontrolinterfaz",
                In = ParameterLocation.Header,
                Required = false,
                Schema = new OpenApiSchema { Type = "integer", Format = "int32" },
                Description = "Identificador de control interfaz (entero mayor a 0)"
            });

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "idevento",
                In = ParameterLocation.Header,
                Required = false,
                Schema = new OpenApiSchema { Type = "integer", Format = "int32" },
                Description = "Identificador del evento (entero mayor a 0)"
            });

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "entidad",
                In = ParameterLocation.Header,
                Required = false,
                Schema = new OpenApiSchema { Type = "integer", Format = "int32" },
                Description = "Identificador de la entidad (entero mayor a 0)"
            });

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "identidad",
                In = ParameterLocation.Header,
                Required = false,
                Schema = new OpenApiSchema { Type = "integer", Format = "int32" },
                Description = "Identificador de la identidad (entero mayor a 0)"
            });

            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "idtipoproceso",
                In = ParameterLocation.Header,
                Required = false,
                Schema = new OpenApiSchema { Type = "integer", Format = "int32" },
                Description = "Identificador de tipo proceso (entero mayor a 0)"
            });
        }
    }
}
