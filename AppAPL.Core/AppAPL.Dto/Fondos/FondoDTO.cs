using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Fondos
{
    public class FondoDTO
    {
        public long IdFondo { get; set; }
        public string? Descripcion { get; set; }
        public string? IdProveedor { get; set; }
        public decimal? IdTipoFondo { get; set; }
        public decimal? ValorFondo { get; set; }
        public DateTime? FechaInicioVigencia { get; set; }
        public DateTime? FechaFinVigencia { get; set; }
        public decimal? ValorDisponible { get; set; }
        public decimal? ValorComprometido { get; set; }
        public decimal? ValorLiquidado { get; set; }
        public string? IdUsuarioIngreso { get; set; }
        public DateTime? FechaIngreso { get; set; }
        public string? IdUsuarioModifica { get; set; }
        public DateTime? FechaModifica { get; set; }
        public int? IdEstadoRegistro { get; set; }
        public int? IndicadorCreacion { get; set; }
    }

    public class BandejaFondoDTO
    {
        public int IdFondo { get; set; }
        public string Descripcion { get; set; }
        public string Proveedor { get; set; }
        public string Tipo_Fondo { get; set; }
        public decimal Valor_Fondo { get; set; }
        public DateTime Fecha_Inicio { get; set; }
        public DateTime Fecha_Fin { get; set; }
        public decimal Valor_Disponible { get; set; }
        public decimal Valor_Comprometido { get; set; }
        public decimal Valor_Liquidado { get; set; }
        public string Estado { get; set; }

    }

    public class CrearFondoRequest
    {
        public string? Descripcion { get; set; }
        public string? IdProveedor { get; set; }
        public decimal? IdTipoFondo { get; set; }
        public decimal? ValorFondo { get; set; }
        public DateTime? FechaInicioVigencia { get; set; }
        public DateTime? FechaFinVigencia { get; set; }
        public string? IdUsuarioIngreso { get; set; }
        public string? NombreUsuarioIngreso { get; set; }
    }

    public class ActualizarFondoRequest
    {
        public string? Descripcion { get; set; }
        public string? IdProveedor { get; set; }
        public decimal? IdTipoFondo { get; set; }
        public decimal? ValorFondo { get; set; }
        public DateTime? FechaInicioVigencia { get; set; }
        public DateTime? FechaFinVigencia { get; set; }
        public string? IdUsuarioModifica { get; set; }
        public string? NombreUsuarioModifica { get; set; }
    }
}
