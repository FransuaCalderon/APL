using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace AppAPL.Api.Filtros
{
    public class OptionalRouteParamFilter: IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            // Detecta parámetros opcionales en la ruta
            foreach (var parameter in operation.Parameters)
            {
                if (parameter.In == ParameterLocation.Path && parameter.Name != null)
                {
                    // Si el parámetro en el método es nullable (string? o int?)
                    var paramInfo = context.MethodInfo
                        .GetParameters()
                        .FirstOrDefault(p =>
                            string.Equals(p.Name, parameter.Name, StringComparison.OrdinalIgnoreCase));

                    if (paramInfo != null && Nullable.GetUnderlyingType(paramInfo.ParameterType) != null)
                    {
                        parameter.Required = false;
                    }
                }
            }
        }
    }
}
