using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Acuerdo
{
    public class AcuerdoDTO
    {
        public int IdAcuerdo { get; set; }
        public int IdTipoAcuerdo { get; set; }
        public int IdMotivoAcuerdo { get; set; }
        public string Descripcion { get; set; }
        public DateTime FechaInicioVigencia { get; set; }
        public DateTime FechaFinVigencia { get; set; }
        public DateTime FechaIngreso { get; set; }
        public string IdUsuarioIngreso { get; set; }
        public DateTime? FechaModifica { get; set; }
        public string? IdUsuarioModifica { get; set; }
        public int IdEstadoRegistro { get; set; }
    }

    public class ConsultarAcuerdoFondoDTO
    {
        public int idfondo { get; set; }
        public string fondo_descripcion { get; set; }
        public string nombre_proveedor { get; set; }
        public int idtipofondo { get; set; }
        public string tipo_fondo_nombre { get; set; }
        public string tipo_fondo_etiqueta { get; set; }
        public decimal valorfondo { get; set; }
        public DateTime fondo_fecha_inicio { get; set; }
        public DateTime fondo_fecha_fin { get; set; }
        public decimal fondo_valor_disponible { get; set; }
        public decimal fondo_valor_comprometido { get; set; }
        public decimal fondo_valor_liquidado { get; set; }
        public string fondo_estado_nombre { get; set; }
        public string fondo_estado_etiqueta { get; set; }
        public int idacuerdofondo { get; set; }
        public decimal valoraporte { get; set; }
        public decimal acuerdofondo_disponible { get; set; }
        public decimal acuerdofondo_comprometido { get; set; }
        public decimal acuerdofondo_liquidado { get; set; }
        public string acuerdofondo_estado_nombre { get; set; }
        public string acuerdofondo_estado_etiqueta { get; set; }
        public int idacuerdo { get; set; }
        public string acuerdo_descripcion { get; set; }
        public int idtipoacuerdo { get; set; }
        public string tipo_acuerdo_nombre { get; set; }
        public string tipo_acuerdo_etiqueta { get; set; }
        public int idmotivoacuerdo { get; set; }

        public string motivo_acuerdo_nombre { get; set; }
        public string motivo_acuerdo_etiqueta { get; set; }
        public DateTime acuerdo_fecha_inicio { get; set; }
        public DateTime acuerdo_fecha_fin { get; set; }
        public string acuerdo_estado_nombre { get; set; }
        public string acuerdo_estado_etiqueta { get; set; }
        public DateTime fondo_fecha_ingreso { get; set; }
        public DateTime acuerdo_fecha_ingreso { get; set; }
    }

    public class CrearActualizarAcuerdoDTO
    {
        public int IdTipoAcuerdo { get; set; }
        public int IdMotivoAcuerdo { get; set; }
        public string Descripcion { get; set; }
        public DateTime FechaInicioVigencia { get; set; }
        public DateTime FechaFinVigencia { get; set; }
        public DateTime? FechaIngreso { get; set; }
        public string? IdUsuarioIngreso { get; set; }
        public DateTime? FechaModifica { get; set; }
        public string? IdUsuarioModifica { get; set; }
        public int IdEstadoRegistro { get; set; }
    }

    public class AprobarAcuerdoDTO
    {
        public int IdTipoAcuerdo { get; set; }
        public int IdMotivoAcuerdo { get; set; }
        public string Descripcion { get; set; }
        public DateTime FechaInicioVigencia { get; set; }
        public DateTime FechaFinVigencia { get; set; }
        public DateTime? FechaIngreso { get; set; }
        public string? IdUsuarioIngreso { get; set; }
        public DateTime? FechaModifica { get; set; }
        public string? IdUsuarioModifica { get; set; }
        public int IdEstadoRegistro { get; set; }
    }

    public class InactivarAcuerdoDTO
    {
        public int IdTipoAcuerdo { get; set; }
        public int IdMotivoAcuerdo { get; set; }
        public string Descripcion { get; set; }
        public DateTime FechaInicioVigencia { get; set; }
        public DateTime FechaFinVigencia { get; set; }
        public DateTime? FechaIngreso { get; set; }
        public string? IdUsuarioIngreso { get; set; }
        public DateTime? FechaModifica { get; set; }
        public string? IdUsuarioModifica { get; set; }
        public int IdEstadoRegistro { get; set; }
    }
}
