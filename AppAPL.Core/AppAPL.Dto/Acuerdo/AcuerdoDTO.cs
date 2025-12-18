using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json.Nodes;

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
        public string MarcaProcesoAprobacion { get; set; }
        public int NumeroLoteAprobacion { get; set; }
    }

    public class AcuerdoFondoDTO
    {
        public int IdAcuerdoFondo { get; set; }
        public int IdAcuerdo { get; set; }
        public int IdFondo { get; set; }
        public decimal ValorAporte { get; set; }
        public decimal ValorDisponible { get; set; }
        public decimal ValorComprometido { get; set; }
        public decimal ValorLiquidado { get; set; }
        public int IdEstadoRegistro { get; set; }
    }

    public class AcuerdoArticuloDTO
    {
        public int idAcuerdoArticulo { get; set; }
        public string codigoArticulo { get; set; }
        public decimal costoActual { get; set; }
        public int unidadesLimite { get; set; }
        public decimal precioContado { get; set; }
        public decimal precioTarjetaCredito { get; set; }
        public decimal precioCredito { get; set; }
        public decimal margenContado { get; set; }
        public decimal margenTarjetaCredito { get; set; }
        public decimal valorAporte { get; set; }
        public decimal valorComprometido { get; set; }
        public int idEstadoRegistro { get; set; }
    }

    public class FondoAcuerdoDTO
    {
        public int IdFondo { get; set; }
        public string Descripcion { get; set; }
        public string IdProveedor { get; set; }
        public string Nombre { get; set; }
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
        public string Codigo { get; set; }
        public string Nombre { get; set; }
    }

    public class DivisionDTO
    {
        public string Codigo { get; set; }
        public string Nombre { get; set; }
    }

    public class DepartamentoDTO
    {
        public string Codigo { get; set; }
        public string Nombre { get; set; }
    }

    public class ClaseDTO
    {
        public string Codigo { get; set; }
        public string Nombre { get; set; }
    }

    public class FiltrosItemsDTO
    {
        public IEnumerable<MarcaDTO> Marcas { get; set; } = Enumerable.Empty<MarcaDTO>();
        public IEnumerable<DivisionDTO> Divisiones { get; set; } = Enumerable.Empty<DivisionDTO>();
        public IEnumerable<DepartamentoDTO> Departamentos { get; set; } = Enumerable.Empty<DepartamentoDTO>();
        public IEnumerable<ClaseDTO> Clases { get; set; } = Enumerable.Empty<ClaseDTO>();
    }

    public class ArticuloDTO
    {
        public string Codigo { get; set; }
        public string Descripcion { get; set; }
        
        public decimal Costo { get; set; }
        public int Stock { get; set; }
        public int Optimo { get; set; }
        public decimal Excedente_U { get; set; }
        public decimal Excedente_D { get; set; }
        public int M0_U { get; set; }
        public decimal M0_D { get; set; }
        public int M1_U { get; set; }
        public decimal M1_D { get; set; }
        public int M2_U { get; set; }
        public decimal M2_D { get; set; }
        
    }

    public class BandejaAprobacionAcuerdoDTO
    {
        public string Solicitud { get; set; }
        public int IdAcuerdo { get; set; }
        public string Descripcion { get; set; }
        public int Id_Fondo { get; set; }
        public int Id_Tipo_Fondo { get; set; }
        public string nombre_tipo_fondo { get; set; }
        public string nombre_proveedor { get; set; }
        public int id_tipo_clase_acuerdo { get; set; }
        public string nombre_clase_acuerdo { get; set; }
        public int cantidad_articulos { get; set; }
        
        public decimal valor_acuerdo { get; set; }
        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public decimal valor_disponible { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_liquidado { get; set; }
        public int idestados_acuerdo { get; set; }
        public string nombre_estado_acuerdo { get; set; }
        public string id_etiqueta_estado_acuerdo { get; set; }
        public int nivelaprobacion { get; set; }
        public string aprobador { get; set; }
        public int idaprobacion { get; set; }
        public int id_entidad { get; set; }
        public string entidad_etiqueta { get; set; }
        public int id_tipo_proceso { get; set; }
        public string tipo_proceso_etiqueta { get; set; }
        public string estado_aprob_etiqueta { get; set; }
        
    }

    public class BandAproAcuerdoPorIDDTO
    {
        public BandejaAprobacionAcuerdoDTO? cabecera { get; set; }
        public IEnumerable<AcuerdoArticuloDTO>? articulos { get; set; }
        public string? TipoAcuerdo { get; set; }
    }

    public class BandejaConsultaAcuerdoDTO
    {
        public int idacuerdo { get; set; }
        public string descripcion { get; set; }
        public int idfondo { get; set; }
        public string nombre_tipo_fondo { get; set; }
        public string nombre_proveedor { get; set; }
        public string clase_acuerdo { get; set; }
        public int cantidad_articulos { get; set; }
        public decimal valor_acuerdo { get; set; }
        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public decimal valor_disponible { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_liquidado { get; set; }
        public string estado { get; set; }
        public string estado_etiqueta { get; set; }
    }

    public class BandConsAcuerdoCabeceraDTO
    {
        public int idacuerdo { get; set; }
        public int idtipoacuerdo { get; set; }
        public string clase_acuerdo { get; set; }
        public string clase_acuerdo_etiqueta { get; set; }
        public int cantidad_articulos { get; set; }
        public int idmotivoacuerdo { get; set; }
        public string motivo { get; set; }
        public string descripcion { get; set; }
        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public int idacuerdofondo { get; set; }
        public int idfondo { get; set; }
        public string fondo_proveedor { get; set; }
        public decimal valor_total { get; set; }
        public decimal valor_disponible { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_liquidado { get; set; }
        public int idestadoregistro { get; set; }
        public string estado { get; set; }
        public string estado_etiqueta { get; set; }
    }

    public class ArticuloBandConsDTO
    {
        public int idacuerdoarticulo { get; set; }
        public int idacuerdo { get; set; }
        public string articulo { get; set; }
        public decimal costo { get; set; }
        public int unidades_limite { get; set; }
        public decimal precio_contado { get; set; }
        public decimal precio_tc { get; set; }
        public decimal precio_credito { get; set; }
        public decimal aporte_unidad_proveedor { get; set; }
        public decimal comprometido_proveedor { get; set; }
        public decimal margen_contado { get; set; }
        public decimal margen_tc { get; set; }
        public int idestadoregistro { get; set; }
    }

    public class PromocionBandConsDTO
    {
        public int idpromocion { get; set; }
        public string descripcion { get; set; }
        public int id_motivo { get; set; }
        public string motivo_nombre { get; set; }
        public int id_clase_promocion { get; set; }
        public string clase_acuerdo { get; set; }
        public decimal valor_comprometido { get; set; }
        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public string marca_regalo { get; set; }
        public int id_estado { get; set; }
        public string estado { get; set; }
        public string estado_etiqueta { get; set; }

    }

    public class BandConsAcuerdoPorIDDTO
    {
        public BandConsAcuerdoCabeceraDTO? cabecera { get; set; }
        public IEnumerable<ArticuloBandConsDTO>? articulos { get; set; }
        public IEnumerable<PromocionBandConsDTO>? promociones { get; set; }
        public string? TipoAcuerdo { get; set; }
    }

    public class BandejaInactivacionAcuerdoDTO
    {
        public int idacuerdo { get; set; }
        public string descripcion { get; set; }
        public int id_fondo { get; set; }
        public string nombre_tipo_fondo { get; set; }
        public string nombre_proveedor { get; set; }
        public string clase_acuerdo { get; set; }
        public int cantidad_articulos { get; set; }
        public decimal valor_acuerdo { get; set; }
        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public decimal valor_disponible { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_liquidado { get; set; }
        public string estado { get; set; }
        
    }

    public class BandejaModificacionAcuerdoDTO 
    {
        public int idacuerdo { get; set; }
        public string descripcion { get; set; }
        public int idfondo { get; set; }
        public string nombre_tipo_fondo { get; set; }
        public string nombre_proveedor { get; set; }
        public string clase_acuerdo { get; set; }
        public int cantidad_articulos { get; set; }
        public decimal valor_acuerdo { get; set; }
        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public decimal valor_disponible { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_liquidado { get; set; }
        public string estado { get; set; }
        public string estado_etiqueta { get; set; }
    }

    public class BandModAcuerdoCabeceraDTO
    {
        public int idacuerdo { get; set; }
        public int idtipoacuerdo { get; set; }
        public string clase_acuerdo { get; set; }
        public string clase_acuerdo_etiqueta { get; set; }
        public int idmotivoacuerdo { get; set; }
        public string motivo { get; set; }
        public string descripcion { get; set; }
        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public int idacuerdofondo { get; set; }
        public int idfondo { get; set; }
        public decimal valor_total { get; set; }
        public decimal valor_disponible { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_liquidado { get; set; }
        public int idestadoregistro { get; set; }
        public string estado { get; set; }
        public string estado_etiqueta { get; set; }
    }

    public class ArticuloBandModDTO
    {
        public int idacuerdoarticulo { get; set; }
        public int idacuerdo { get; set; }
        public string articulo { get; set; }
        public decimal costo { get; set; }
        public int unidades_limite { get; set; }
        public decimal precio_contado { get; set; }
        public decimal precio_tc { get; set; }
        public decimal precio_credito { get; set; }
        public decimal aporte_unidad_proveedor { get; set; }
        public decimal comprometido_proveedor { get; set; }
        public decimal margen_contado { get; set; }
        public decimal margen_tc { get; set; }
        public int idestadoregistro { get; set; }
    }

    public class BandModAcuerdoPorIDDTO
    {
        public BandModAcuerdoCabeceraDTO? cabecera { get; set; }
        public IEnumerable<ArticuloBandModDTO>? articulos { get; set; }
        public string? TipoAcuerdo { get; set; }
    }

    public class ConsultarArticuloDTO
    {
        public List<string>? Marcas { get; set; }
        public List<string>? Divisiones { get; set; }
        public List<string>? Departamentos { get; set; }
        public List<string>? Clases { get; set; }
        public string? CodigoArticulo { get; set; }
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
        public int? IdAcuerdo { get; set; }
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
        public int? IdAcuerdoArticulo { get; set; }
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
        public string TipoClaseEtiqueta { get; set; }
        public int IdOpcion { get; set; }
        public string IdControlInterfaz { get; set; }
        public string IdEvento { get; set; }
        public CrearActualizarAcuerdoDTO Acuerdo { get; set; }
        public CrearActualizarAcuerdoFondoDTO Fondo { get; set; }
        public IEnumerable<CrearActualizarAcuerdoArticuloDTO> Articulos { get; set; }

    }

    public class AprobarAcuerdoRequest
    {
        public int? Entidad { get; set; }
        public int? Identidad { get; set; }
        public int? IdTipoProceso { get; set; }
        public string? IdEtiquetaTipoProceso { get; set; }
        public string? Comentario { get; set; }
        public string? IdEtiquetaEstado { get; set; }
        public int? IdAprobacion { get; set; }
        public string? UsuarioAprobador { get; set; }

        public int? IdOpcion { get; set; }
        public string? IdControlInterfaz { get; set; }
        public string? IdEvento { get; set; }
        public string? NombreUsuario { get; set; }

    }

    public class InactivarAcuerdoRequest
    {
        public int IdAcuerdo { get; set; }
        public string? NombreUsuarioIngreso { get; set; }

        public int? IdOpcion { get; set; }
        public string? IdControlInterfaz { get; set; }
        public string? IdEvento { get; set; }
        public string? NombreUsuario { get; set; }

    }

    public class InactivarAcuerdoResponse
    {
        public ControlErroresDTO retorno { get; set; }
        public IEnumerable<PromocionBandConsDTO> promociones { get; set; }
    }


}
