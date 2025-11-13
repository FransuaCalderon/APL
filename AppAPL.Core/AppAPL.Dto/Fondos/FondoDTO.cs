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
        public int? estado_id { get; set; }
        public string? estado_nombre { get; set; }
        public string? estado_etiqueta { get; set; }
    }


    public class BandejaAprobacionDTO
    {
        public string Solicitud { get; set; }
        public string idetiquetatipoproceso { get; set; }
        public int idtipoproceso { get; set; }
        public int idfondo { get; set; }
        public string descripcion { get; set; }
        public string proveedor { get; set; }
        public string tipo_fondo { get; set; }
        public decimal valor_fondo { get; set; }
        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public decimal valor_disponible { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_liquidado { get; set; }
        public int idestados_fondo { get; set; }
        public string nombre_estado_fondo { get; set; }
        public string id_etiqueta_estado_fondo { get; set; }
        public int nivelaprobacion { get; set; }
        public string aprobador { get; set; }
        public int idaprobacion { get; set; }
        public string entidad_etiqueta { get; set; }
        public string tipo_proceso_etiqueta { get; set; }
        public string estado_aprob_etiqueta { get; set; }
    }

    public class BandejaFondoDTO
    {
        public int IdFondo { get; set; }
        public string? Descripcion { get; set; }
        public string? Proveedor { get; set; }
        public string? Tipo_Fondo { get; set; }
        public decimal? Valor_Fondo { get; set; }
        public DateTime? Fecha_Inicio { get; set; }
        public DateTime? Fecha_Fin { get; set; }
        public decimal? Valor_Disponible { get; set; }
        public decimal? Valor_Comprometido { get; set; }
        public decimal? Valor_Liquidado { get; set; }
        public string? Estado { get; set; }

    }

    public class CrearFondoRequest
    {
        public string? Descripcion { get; set; }
        public string? IdProveedor { get; set; }
        public int? IdTipoFondo { get; set; }
        public decimal ValorFondo { get; set; }
        public DateTime? FechaInicioVigencia { get; set; }
        public DateTime? FechaFinVigencia { get; set; }
        public string? IdUsuarioIngreso { get; set; }
        public string? NombreUsuarioIngreso { get; set; }
        public int IdOpcion { get; set; }
        public int IdControlInterfaz { get; set; }
        public int IdEvento { get; set; }
    }

    public class ActualizarFondoRequest
    {
        public string? Descripcion { get; set; }
        public string? IdProveedor { get; set; }
        public int? IdTipoFondo { get; set; }
        public decimal ValorFondo { get; set; }
        public DateTime? FechaInicioVigencia { get; set; }
        public DateTime? FechaFinVigencia { get; set; }
        public string? IdUsuarioModifica { get; set; }
        public string? NombreUsuarioModifica { get; set; }
    }

    public class AprobarFondoRequest
    {
        public int Entidad { get; set; }
        public int Identidad { get; set; }
        public int idTipoProceso { get; set; }
        public string idEtiquetaTipoProceso { get; set; }
        public string Comentario { get; set; }
        public string idEtiquetaEstado { get; set; }
        public int IdAprobacion { get; set; }
        public string UsuarioAprobador { get; set; }

    }


}
