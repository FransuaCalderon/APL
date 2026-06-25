using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Utilidades
{
    public class LowerCaseNamingPolicy : JsonNamingPolicy
    {
        public override string ConvertName(string name)
        {
            // Convierte el nombre de la propiedad a minúsculas estrictas
            return name.ToLowerInvariant();
        }
    }
}
