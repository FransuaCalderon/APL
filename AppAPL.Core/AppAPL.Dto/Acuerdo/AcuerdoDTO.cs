using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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

    public class FondoAcuerdoDTO
    {
        public int IdFondo { get; set; }
        public string Descripcion { get; set; }
        public string IdProveedor { get; set; }
        public int IdTipoFondo { get; set; }
        public decimal ValorFondo { get; set; }
        public DateTime FechaInicioVigencia { get; set; }
        public DateTime FechaFinVigencia { get; set; }
        public decimal ValorDisponible { get; set; }
        public decimal ValorComprometido { get; set; }
        public decimal ValorLiquidado { get; set; }
        public int IdEstadoRegistro { get; set; }
        public int IndicadorCreacion { get; set; }
        public string MarcaProcecsoAprobacion { get; set; }

    }

    public class MarcaDTO
    {
        public int IdMarca { get; set; }
        public string Nombre { get; set; }
    }

    public class DivisionDTO
    {
        public int IdDivision { get; set; }
        public string Nombre { get; set; }
    }

    public class DepartamentoDTO
    {
        public int IdDepartamento { get; set; }
        public string Nombre { get; set; }
    }

    public class ClaseDTO
    {
        public int IdClase { get; set; }
        public string Nombre { get; set; }
    }

    public class ArticuloDTO
    {
        public int IdArticulo { get; set; }
        public string Nombre { get; set; }
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
        public string? Descripcion { get; set; }
        public DateTime FechaInicioVigencia { get; set; }
        public DateTime FechaFinVigencia { get; set; }
        public string? IdUsuarioIngreso { get; set; }
        public int IdEstadoRegistro { get; set; }

        //[Required(ErrorMessage = "El campo {0} es requerido")]
        //[RegularExpression("[AI]", ErrorMessage = "El campo {0} solo debe tener uno de estos caracteres {1}")]
        [StringLength(maximumLength: 1, ErrorMessage = "el campo {0} no debe tener mas de un caracter")]
        public string? MarcaProcesoAprobacion { get; set; }
    }

    public class CrearActualizarAcuerdoFondoDTO
    {
        public int IdFondo { get; set; }
        public decimal ValorAporte { get; set; }
        public decimal ValorDisponible { get; set; }
        public decimal ValorComprometido { get; set; }
        public decimal ValorLiquidado { get; set; }
    }

    public class CrearActualizarAcuerdoArticuloDTO
    {
        public string? CodigoArticulo { get; set; }
        public decimal CostoActual { get; set; }
        public int UnidadesLimite { get; set; }
        public decimal PrecioContado { get; set; }
        public decimal PrecioTarjetaCredito { get; set; }
        public decimal PrecioCredito { get; set; }
        public decimal ValorAporte { get; set; }
        public decimal ValorComprometido { get; set; }
        public decimal MargenContado { get; set; }
        public decimal MargenTarjetaCredito { get; set; }
    }

    public class CrearActualizarAcuerdoGrupoDTO
    {
        public string? TipoClaseEtiqueta { get; set; }
        public CrearActualizarAcuerdoDTO Acuerdo { get; set; }
        public CrearActualizarAcuerdoFondoDTO Fondo { get; set; }
        public IEnumerable<CrearActualizarAcuerdoArticuloDTO> Articulos { get; set; }

    }

    
}
