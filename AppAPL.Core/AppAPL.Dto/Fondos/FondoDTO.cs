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
        public string? Descripcion { get; set; }        // VARCHAR2(100)
        public decimal? IdProveedor { get; set; }            // NUMBER(18,2)
        public decimal? IdTipoFondo { get; set; }              // NUMBER(18,2)
        public decimal? ValorFondo { get; set; }             // NUMBER(18,2)
        public DateTime? FechaInicioVigencia { get; set; }   // DATE
        public DateTime? FechaFinVigencia { get; set; }      // DATE
        public decimal? ValorDisponible { get; set; }        // NUMBER(18,2)
        public decimal? ValorComprometido { get; set; }      // NUMBER(18,2)
        public decimal? ValorLiquidado { get; set; }        // NUMBER(18,2)
        public int? IdUsuarioIngreso { get; set; }
        public DateTime? FechaIngreso { get; set; }
        public int? IdUsuarioModifica { get; set; }
        public DateTime? FechaModifica { get; set; }
        public int? IdEstadoRegistro { get; set; }         // NUMBER(18,2)
        public decimal? IndicadorCreacion { get; set; }      // NUMBER(18,2)
    }

    public class CrearActualizarFondoRequest
    {
        public string? Descripcion { get; set; }        // VARCHAR2(100)
        public decimal? IdProveedor { get; set; }            // NUMBER(18,2)
        public decimal? IdTipoFondo { get; set; }              // NUMBER(18,2)
        public decimal? ValorFondo { get; set; }             // NUMBER(18,2)
        public DateTime? FechaInicioVigencia { get; set; }   // DATE
        public DateTime? FechaFinVigencia { get; set; }      // DATE
        public decimal? ValorDisponible { get; set; }        // NUMBER(18,2)
        public decimal? ValorComprometido { get; set; }      // NUMBER(18,2)
        public decimal? ValorLiquidado { get; set; }        // NUMBER(18,2)
        public int? IdUsuarioIngreso { get; set; }
        public DateTime? FechaIngreso { get; set; }
        public int? IdUsuarioModifica { get; set; }
        public DateTime? FechaModifica { get; set; }
        public int? IdEstadoRegistro { get; set; }         // NUMBER(18,2)
        public decimal? IndicadorCreacion { get; set; }      // NUMBER(18,2)
    }
}
