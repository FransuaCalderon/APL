using System.Text.Json;

namespace AppAPL.Api.Utilidades
{
    public class CustomSnakeCaseNamingPolicy : JsonNamingPolicy
    {
        public override string ConvertName(string name)
        {
            // Convierte el nombre a minúsculas
            return name.ToLower();
        }
    }
}
