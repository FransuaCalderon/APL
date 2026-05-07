using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto
{
    

    public class AportesPorMarcaDTO
    {
        public int idparametrodato { get; set; }

        public int idparametro { get; set; }

        public int codigoparametro { get; set; }

        public string codigo_marca { get; set; } = string.Empty;

        public string nombre_marca { get; set; } = string.Empty;

        public string Numero_Aporte { get; set; } = string.Empty;
    }

    public class AportesPorArticuloDTO
    {
        public int idparametrodato { get; set; }

        public int idparametro { get; set; }

        public int codigoparametro { get; set; }

        public string codigo_articulo { get; set; } = string.Empty;

        public string nombre_articulo { get; set; } = string.Empty;

        public string Numero_Aporte { get; set; } = string.Empty;
    }

    public class AportesPorMarcaProveedorDTO
    {
        public int idparametrodato { get; set; }

        public int idparametro { get; set; }

        public int codigoparametro { get; set; }

        public string codigo_marca { get; set; } = string.Empty;

        public string nombre_marca { get; set; } = string.Empty;

        public string identificacion_proveedor { get; set; } = string.Empty;

        public string nombre_proveedor { get; set; } = string.Empty;

        public string Numero_Aporte { get; set; } = string.Empty;
    }
}
