using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Fondos
{
    public class FondoDTO
    {
        public long IdFondo { get; set; }                    // NUMBER(18,0) Identity
        public string? DescripcionFondo { get; set; }        // VARCHAR2(100)
        public decimal? IdProveedor { get; set; }            // NUMBER(18,2)
        public decimal? TipoFondo { get; set; }              // NUMBER(18,2)
        public decimal? ValorFondo { get; set; }             // NUMBER(18,2)
        public DateTime? FechaInicioVigencia { get; set; }   // DATE
        public DateTime? FechaFinVigencia { get; set; }      // DATE
        public decimal? ValorDisponible { get; set; }        // NUMBER(18,2)
        public decimal? ValorComprometido { get; set; }      // NUMBER(18,2)
        public decimal? ValorLiquidado { get; set; }        // NUMBER(18,2)
        public decimal? EstadoRegistro { get; set; }         // NUMBER(18,2)
        public decimal? IndicadorCreacion { get; set; }      // NUMBER(18,2)
    }

    public class CrearActualizarFondoRequest
    {
        public string? DescripcionFondo { get; set; }
        public decimal? IdProveedor { get; set; }
        public decimal? TipoFondo { get; set; }
        public decimal? ValorFondo { get; set; }
        public DateTime? FechaInicioVigencia { get; set; }
        public DateTime? FechaFinVigencia { get; set; }
        public decimal? ValorDisponible { get; set; }
        public decimal? ValorComprometido { get; set; }
        public decimal? ValorLiquidado { get; set; }
        public decimal? EstadoRegistro { get; set; }
        public decimal? IndicadorCreacion { get; set; }
    }
}
