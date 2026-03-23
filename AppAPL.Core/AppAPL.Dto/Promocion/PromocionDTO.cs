
using AppAPL.Dto.Acuerdo;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace AppAPL.Dto.Promocion
{
    public class PromocionDTO
    {
        public int IDPROMOCION { get; set; }
        public string DESCRIPCION { get; set; }
        public string nombre_motivo { get; set; }
        public string clase_promocion { get; set; }
        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public string regalo { get; set; }
        public string soporte { get; set; }
        public string estado { get; set; }
        public string estado_etiqueta { get; set; }
    }

    public class PromocionAcuerdoDTO
    {
        public int IDPROMOCIONACUERDO { get; set; }
        public int IDPROMOCION { get; set; }
        public int IDACUERDO { get; set; }
        public decimal PORCENTAJEDESCUENTO { get; set; }
        public decimal VALORCOMPROMETIDO { get; set; }
        public decimal VALORDISPONIBLE { get; set; }
        public decimal VALORLIQUIDADO { get; set; }
        public int ESTADOREGISTRO { get; set; }
    }

    public class PromocionArticuloDTO
    {
        public int IDPROMOCIONARTICULO { get; set; }
        public int IDPROMOCION { get; set; }
        public int IDPROMOCIONCOMBO { get; set; }
        public string CODIGOITEM { get; set; }
        public string DESCRIPCION { get; set; }
        public decimal COSTO { get; set; }
        public int STOCKDISPONIBLE { get; set; }
        public int INVENTARIOOPTIMO { get; set; }
        public int EXCEDENTEUNIDAD { get; set; }
        public decimal EXCEDENTEVALOR { get; set; }
        public int CANTIDADVENDIDAPERIODO1 { get; set; }
        public int CANTIDADVENDIDAPERIODO2 { get; set; }
        public int CANTIDADVENDIDAPERIODO3 { get; set; }
        public decimal PRECIOMINIMO { get; set; }
        public int UNIDADESLIMITE { get; set; }
        public int UNIDADESPROYECCIONVENTAS { get; set; }
        public decimal PRECIOACTUAL { get; set; }
        public decimal PRECIOPROMOCION { get; set; }
        public decimal DESCUENTOACTUAL { get; set; }
        public decimal DESCUENTOPROMOCION { get; set; }
        public decimal MARGENACTUAL { get; set; }
        public decimal MARGENPROMOCION { get; set; }
        public decimal UTILIDADACTUAL { get; set; }
        public decimal UTILIDADPROMOCION { get; set; }
        public decimal PORCENTAJECOMISION { get; set; }
        public decimal VALORCOMISION { get; set; }
        public int ESTADOREGISTRO { get; set; }
    }

    public class PromocionSegmentoDTO
    {
        public int IDPROMOCIONSEGMENTO { get; set; }
        public int IDPROMOCION { get; set; }
        public string IDTIPOSEGMENTO { get; set; }
        public string TIPOASIGNACION { get; set; }
        public int ESTADOREGISTRO { get; set; }
    }

    public class PromocionSegmentoDetalleDTO
    {
        public int IDPROMOCIONSEGMENTODETALLE { get; set; }
        public int IDPROMOCIONSEGMENTO { get; set; }
        public string CODIGO { get; set; }
        public int ESTADOREGISTRO { get; set; }
    }

    public class TipoClienteDTO
    {
        public string CODIGO { get; set; }
        public string NOMBRE { get; set; }
    }

    public class OtrosCostosDTO
    {
        public string GRUPO { get; set; }
        public string SUBGRUPO { get; set; }
        public int SECUENCIAL { get; set; }
        public decimal PRECIO { get; set; }
        public string DESCRIPCION { get; set; }
    }

    public class GrupoAlmacenDTO
    {
        public string CODIGO { get; set; }
        public string NOMBRE { get; set; }
        public string CODIGOALMACEN { get; set; }
    }

    public class CanalDTO
    {
        public string CODIGO { get; set; }
        public string NOMBRE { get; set; }
    }

    public class ArticuloPrecioCompetenciaDTO
    {
        public string CODIGOARTICULO { get; set; }
        public string NOMBREEMPRESA { get; set; }
        public decimal VALOR { get; set; }
    }

    public class ArticuloEquivalenteDTO
    {
        public string CODIGOARTICULO { get; set; }
        public string CODIGOARTICULOEQUIVALENTE { get; set; }
    }

    public class AlmacenDTO
    {
        public string CODIGO { get; set; }
        public string NOMBRE { get; set; }
    }

    public class MedioPagoDTO
    {
        public string CODIGO { get; set; }
        public string DESCRIPCION { get; set; }
    }


    public class GruposPromocionesDTO
    {
        public IEnumerable<CanalDTO> Canales { get; set; } = Enumerable.Empty<CanalDTO>();
        public IEnumerable<AlmacenDTO> Almacenes { get; set; } = Enumerable.Empty<AlmacenDTO>();
        public IEnumerable<GrupoAlmacenDTO> GruposAlmacenes { get; set; } = Enumerable.Empty<GrupoAlmacenDTO>();
        public IEnumerable<TipoClienteDTO> TiposClientes { get; set; } = Enumerable.Empty<TipoClienteDTO>();
        public IEnumerable<MedioPagoDTO> MediosPagos { get; set; } = Enumerable.Empty<MedioPagoDTO>();
    }

    public class ArticuloPromocionDTO
    {
        public string codigo_marca { get; set; }
        public string nombre_marca { get; set; }
        public string codigo_division { get; set; }
        public string nombre_division { get; set; }
        public string codigo_departamento { get; set; }
        public string nombre_departamento { get; set; }
        public string codigo_clase { get; set; }
        public string nombre_clase { get; set; }
    }

    public class ConsultarCombosPromocionesDTO
    {
        public string? codigoAlmacen { get; set; }
        public int? incluirTodos { get; set; }
    }

    public class SegmentoBandejaDTO
    {
        // Campos de la tabla apl_tb_promocionsegmento (seg)
        public int idpromocionsegmento { get; set; }
        public int idpromocion { get; set; }
        public int idtiposegmento { get; set; }
        public string nombre_tipo_segmento { get; set; }
        public string etiqueta_tipo_segmento { get; set; }
        public string tipoasignacion { get; set; }
        public string descripcion_asignacion { get; set; }
        public int id_estado_segmento { get; set; }
        public string nombre_estado_segmento { get; set; }

        // Campos del detalle (det) - Nullables porque vienen de un LEFT JOIN
        public int? idpromocionsegmentodetalle { get; set; }
        public string codigo_detalle { get; set; }
        public string nombre_detalle { get; set; }
        public int? id_estado_detalle { get; set; }
        public string nombre_estado_detalle { get; set; }
    }

    public class BandInacPromocionDTO
    {
        public int IDPROMOCION { get; set; }
        public string DESCRIPCION { get; set; }
        public string MOTIVO { get; set; }
        public string CLASE_PROMOCION { get; set; }
        public DateTime FECHA_INICIO { get; set; }
        public DateTime FECHA_FIN { get; set; }
        public string REGALO { get; set; }
        
        public string SOPORTE { get; set; }
        public string ESTADO { get; set; }
    }

    public class BandModPromocionDTO
    {
        public int idpromocion { get; set; }
        public string descripcion { get; set; }
        public string motivo { get; set; }
        public string clase_promocion { get; set; }
        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public string marcaregalo { get; set; }
        public string archivosoporte { get; set; }
        public string estado { get; set; }
        public string estado_etiqueta { get; set; }
        public int idaprobacion { get; set; }
        public string idusersolicitud { get; set; }
        public string nombreusersolicitud { get; set; }
        public DateTime fechasolicitud { get; set; }
        public int nivelaprobacion { get; set; }
        public int numeroloteaprobacion { get; set; }
    }

    public class BandAproPromocionDTO
    {
        public string solicitud { get; set; }
        public int idpromocion { get; set; }
        public string descripcion { get; set; }
        public int motivo { get; set; }
        public int id_clase_promocion { get; set; }
        public string nombre_clase_promocion { get; set; }
        public DateTime fechahorainicio { get; set; }
        public DateTime fechahorafin { get; set; }
        public string nombreusersolicitud { get; set; }
        public DateTime fechasolicitud { get; set; }
        public string marcaregalo { get; set; }
        public int idestado_promocion { get; set; }
        public string nombre_estado { get; set; }
        public string id_etiqueta_estado { get; set; }
        public string archivosoporte { get; set; }
        public int nivelaprobacion { get; set; }
        public string aprobador { get; set; }
        public int idaprobacion { get; set; }
        public int tiene_aprobador { get; set; }
    }

    public class BandInacPromocionIDDTO
    {
        // Lista para capturar el cursor p_cursor_cabecera
        public CabeceraBandInacPromoDTO? cabecera { get; set; }
        public List<SegmentoBandejaDTO> segmentos { get; set; }
        public List<AcuerdoBandAproDTO>? acuerdos { get; set; }

        public List<ArticuloBandAproPromoDTO>? articulos { get; set; }
        public List<ArticuloSegmentoDTO>? articulosSegmentos { get; set; }
        public List<ArticuloAcuerdoPromoDTO>? articulosAcuerdos { get; set; }
        public List<ArticuloOtrosCostosDTO>? articulosOtros { get; set; }


        public string? tipopromocion { get; set; }
        [JsonIgnore]
        public int? codigoSalida { get; set; }
        [JsonIgnore]
        public string? mensajeSalida { get; set; }
    }

    public class BandGenPromocionIDDTO
    {
        // Lista para capturar el cursor p_cursor_cabecera
        public CabeceraBandInacPromoDTO? cabecera { get; set; }
        public List<SegmentoBandejaDTO>? segmentos { get; set; }
        public List<AcuerdoBandAproDTO>? acuerdos { get; set; }

        public List<ArticuloBandAproPromoDTO>? articulos { get; set; }
        public List<ArticuloSegmentoDTO>? articulosSegmentos { get; set; }
        public List<ArticuloAcuerdoPromoDTO>? articulosAcuerdos { get; set; }
        public List<ArticuloOtrosCostosDTO>? articulosOtros { get; set; }

        public string? clase_promocion { get; set; }
        [JsonIgnore]
        public int? codigoSalida { get; set; }
        [JsonIgnore]
        public string? mensajeSalida { get; set; }
    }

    public class CabeceraBandInacPromoDTO
    {
       
        public int IdPromocion { get; set; }
        public string Descripcion { get; set; }
        public int id_motivo { get; set; }
        public string nombre_motivo { get; set; }
        public int id_clase_promocion { get; set; }
        public string nombre_clase_promocion { get; set; }
        public string etiqueta_clase_promocion { get; set; }
        public string MarcaRegalo { get; set; }
        public string MarcaProcesoAprobacion { get; set; }
        public int? NumeroLoteAprobacion { get; set; }
        public string ArchivoSoporte { get; set; }
        public int cantidad_acuerdos { get; set; }

        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public int id_estado_promocion { get; set; }
        public string nombre_estado_promocion { get; set; }
        public string etiqueta_estado_promocion { get; set; }
        
    }


    public class BandModPromocionIDDTO
    {
        // Lista para capturar el cursor p_cursor_cabecera
        public CabeceraBandAproPromoDTO? cabecera { get; set; }
        public List<AcuerdoBandAproDTO>? acuerdos { get; set; }
        public List<SegmentoBandejaDTO>? segmentos { get; set; }


        public List<ArticuloBandAproPromoDTO>? articulos { get; set; }

        public List<ArticuloSegmentoDTO>? articulosSegmentos { get; set; }
        public List<ArticuloAcuerdoPromoDTO>? articulosAcuerdos { get; set; }
        public List<ArticuloOtrosCostosDTO>? articulosOtros { get; set; }

        public string? tipopromocion { get; set; }
        [JsonIgnore]
        public int? codigoSalida { get; set; }
        [JsonIgnore]
        public string? mensajeSalida { get; set; }
    }

    public class BandAproPromocionIDDTO
    {
        // Lista para capturar el cursor p_cursor_cabecera
        public CabeceraBandAproPromoDTO? cabecera { get; set; }
        public List<SegmentoBandejaDTO>? segmentos { get; set; }
        public List<AcuerdoBandAproDTO>? acuerdos { get; set; }

        // Lista para capturar el cursor p_cursor_articulos
        public List<ArticuloBandAproPromoDTO>? articulos { get; set; }

        public List<ArticuloSegmentoDTO>? articulosSegmentos { get; set; }
        public List<ArticuloAcuerdoPromoDTO>? articulosAcuerdos { get; set; }
        public List<ArticuloOtrosCostosDTO>? articulosOtros { get; set; }

        public string? tipopromocion { get; set; }
        [JsonIgnore]
        public int? codigoSalida { get; set; }
        [JsonIgnore]
        public string? mensajeSalida { get; set; }
    }

    public class CabeceraBandAproPromoDTO
    {
        public string Solicitud { get; set; }
        public int IdPromocion { get; set; }
        public string Descripcion { get; set; }
        public int id_motivo { get; set; }
        public string nombre_motivo { get; set; }
        public int id_clase_promocion { get; set; }
        public string nombre_clase_promocion { get; set; }
        public string etiqueta_clase_promocion { get; set; }
        public string MarcaRegalo { get; set; }
        public string MarcaProcesoAprobacion { get; set; }
        public int? NumeroLoteAprobacion { get; set; }
        public string ArchivoSoporte { get; set; }
        public int cantidad_acuerdos { get; set; }

        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public int id_estado_promocion { get; set; }
        public string nombre_estado_promocion { get; set; }
        public string etiqueta_estado_promocion { get; set; }
        public int nivelaprobacion { get; set; }

        public string aprobador { get; set; }
        public int idaprobacion { get; set; }
        public int id_entidad { get; set; }
        public string entidad_etiqueta { get; set; }
        public int id_tipo_proceso { get; set; }
        public string tipo_proceso_etiqueta { get; set; }
        public string estado_aprob_etiqueta { get; set; }
    }

    public class ArticuloBandAproPromoDTO
    {
        public int idpromocionarticulo { get; set; }
        public int idpromocion { get; set; }
        public int? idpromocioncombo { get; set; }
        public string codigoitem { get; set; }
        public string descripcion { get; set; }
        public decimal costo { get; set; }
        public decimal stockbodega { get; set; }
        public decimal stocktienda { get; set; }
        public decimal inventariooptimo { get; set; }
        public decimal excedenteunidad { get; set; }
        public decimal excedentevalor { get; set; }
        public decimal m0unidades { get; set; }
        public decimal m0precio { get; set; }
        public decimal m1unidades { get; set; }
        public decimal m1precio { get; set; }
        public decimal m2unidades { get; set; }
        public decimal m2precio { get; set; }
        public decimal igualarprecio { get; set; }
        public decimal diasantinguedad { get; set; }
        public decimal margenminimocontado { get; set; }
        public decimal margenminimotarjetacredito { get; set; }
        public decimal margenminimocredito { get; set; }
        public decimal margenminimoigualar { get; set; }
        public decimal unidadeslimite { get; set; }
        public decimal unidadesproyeccionventas { get; set; }
        public decimal preciolistacontado { get; set; }
        public decimal preciolistacredito { get; set; }
        public decimal preciopromocioncontado { get; set; }
        public decimal preciopromociontarjetacredito { get; set; }
        public decimal preciopromocioncredito { get; set; }
        public decimal precioigualarprecio { get; set; }
        public decimal descuentopromocioncontado { get; set; }
        public decimal descuentopromociontarjetacredito { get; set; }
        public decimal descuentopromocioncredito { get; set; }
        public decimal descuentoigualarprecio { get; set; }
        public decimal margenpreciolistacontado { get; set; }
        public decimal margenpreciolistacredito { get; set; }
        public decimal margenpromocioncontado { get; set; }
        public decimal margenpromociontarjetacredito { get; set; }
        public decimal margenpromocioncredito { get; set; }
        public decimal margenigualarprecio { get; set; }
        public string marcaregalo { get; set; }
        public int id_estado_articulo { get; set; }
        public string nombre_estado_articulo { get; set; }
        public string etiqueta_estado_articulo { get; set; }
    }


    public class ArticuloSegmentoDTO
    {
        public int idpromocionarticulosegmento { get; set; }
        public int idpromocionarticulo { get; set; }
        public string codigoitem { get; set; }
        public string descripcion_articulo { get; set; }
        public int idtiposegmento { get; set; }
        public string nombre_tipo_segmento { get; set; }
        public string etiqueta_tipo_segmento { get; set; }
        public string tipoasignacion { get; set; }
        public string descripcion_asignacion { get; set; }
        public int id_estado_segmento { get; set; }
        public string nombre_estado_segmento { get; set; }
        public int? idpromocionarticulosegmentodetalle { get; set; }
        public string codigo_detalle { get; set; }
        public string nombre_medio_pago { get; set; }
        public int? id_estado_detalle { get; set; }
        public string nombre_estado_detalle { get; set; }
    }

    public class ArticuloAcuerdoPromoDTO
    {
        public int idpromocionarticuloacuerdo { get; set; }
        public int idpromocionarticulo { get; set; }
        public string codigoitem { get; set; }
        public string descripcion_articulo { get; set; }
        public int idacuerdo { get; set; }
        public string descripcion_acuerdo { get; set; }
        public string nombre_proveedor { get; set; }
        public string etiqueta_tipo_fondo { get; set; }
        public string nombre_tipo_fondo { get; set; }
        public string etiqueta_clase_acuerdo { get; set; }
        public string nombre_clase_acuerdo { get; set; }
        public decimal valor_aporte { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_liquidado { get; set; }
        public int? id_estado_detalle { get; set; }
        public string nombre_estado_detalle { get; set; }
        public string etiqueta_estado_detalle { get; set; }
    }


    public class ArticuloOtrosCostosDTO
    {
        public int idpromocionotroscostos { get; set; }
        public int idpromocionarticulo { get; set; }
        public string codigoitem { get; set; }
        public string descripcion_articulo { get; set; }
        public int codigoparametro { get; set; }
        public string nombre_parametro { get; set; }
        public decimal costo { get; set; }
        public int id_estado { get; set; }
        public string nombre_estado { get; set; }
        public string etiqueta_estado { get; set; }
    }


    //----------------------------------------------



    public class AcuerdoPromoDTO
    {
        public int idacuerdo { get; set; }
        public string descripcion { get; set; }
        public int idtipofondo { get; set; }
        public int idfondo { get; set; }
        public string nombre_tipo_fondo { get; set; }
        public string etiqueta_tipo_fondo { get; set; }
        public string nombre_proveedor { get; set; }
        public string clase_acuerdo { get; set; }
        public string etiqueta_clase_acuerdo { get; set; }
        public int idtipoacuerdo { get; set; }
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


    public class AcuerdoPromocionArticuloDTO
    {
        public int idacuerdo { get; set; }
        public string descripcion { get; set; }
        public int idtipofondo { get; set; }
        public int idfondo { get; set; }
        public string nombre_tipo_fondo { get; set; }
        public string etiqueta_tipo_fondo { get; set; }
        public string nombre_proveedor { get; set; }
        public string clase_acuerdo { get; set; }
        public string etiqueta_clase_acuerdo { get; set; }
        public int idtipoacuerdo { get; set; }
        public decimal valor_acuerdo { get; set; }
        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public decimal valor_disponible { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_liquidado { get; set; }
        public string estado { get; set; }
        public string estado_etiqueta { get; set; }
        public decimal valor_aporte_por_items { get; set; }
        public decimal valor_comprometido_items { get; set; }
        public int unidades_limite { get; set; }
    }

    public class AprobarPromocionRequest
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

    public class CrearPromocionRequestDTO
    {
        // Parámetros directos
        public string TipoClaseEtiqueta { get; set; } = string.Empty;
        public int IdOpcion { get; set; }
        public string IdControlInterfaz { get; set; } = string.Empty;
        public string IdEventoEtiqueta { get; set; } = string.Empty;

        public string? NombreArchivoSoporte { get; set; }
        public string? ArchivoSoporteBase64 { get; set; }

        // Objetos que se enviarán como JSON (CLOB) al SP
        public PromocionDataDTO Promocion { get; set; } = new();
        public List<AcuerdoDTO> Acuerdos { get; set; }
        public List<SegmentoDTO> Segmentos { get; set; }
        public List<ArticuloDTO>? Articulos { get; set; }
    }

    public class PromocionDataDTO
    {
        public string Descripcion { get; set; } = string.Empty;
        public int Motivo { get; set; }
        public int ClasePromocion { get; set; }
        // Importante: El SP espera formato ISO 8601 (YYYY-MM-DDTHH:MM:SS.mmmZ)
        public DateTime FechaHoraInicio { get; set; }
        public DateTime FechaHoraFin { get; set; }
        public string MarcaRegalo { get; set; } = "N"; // 'S' o 'N'
        public string MarcaProcesoAprobacion { get; set; } = " ";
        public string IdUsuarioIngreso { get; set; } = string.Empty;
        public string NombreUsuario { get; set; } = string.Empty;
    }

    public class AcuerdoDTO
    {
        public int IdAcuerdo { get; set; }
        public decimal PorcentajeDescuento { get; set; }
        public decimal ValorComprometido { get; set; }
        public string? etiqueta_tipo_fondo { get; set; }

    }

    public class SegmentoDTO
    {
        public string TipoSegmento { get; set; } = string.Empty; // Ej: "SEGMARCA"
        public string TipoAsignacion { get; set; } = "T";        // 'T' (Todos) o 'C' (Codigos)
        public List<string> Codigos { get; set; } = new();       // Array de strings ["001", "002"]
    }


    public class ArticuloDTO
    {
        [Required]
        [StringLength(10)]
        public string codigoItem { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string descripcion { get; set; } = string.Empty;

        public decimal costo { get; set; }
        public int stockBodega { get; set; }
        public int stockTienda { get; set; }
        public int inventarioOptimo { get; set; }
        public int excedenteUnidad { get; set; }
        public decimal excedenteValor { get; set; }
        public int m0Unidades { get; set; }
        public decimal m0Precio { get; set; }
        public int m1Unidades { get; set; }
        public decimal m1Precio { get; set; }
        public int m2Unidades { get; set; }
        public decimal m2Precio { get; set; }
        public decimal igualarPrecio { get; set; }
        public int diasAntiguedad { get; set; }
        public decimal margenMinimoContado { get; set; }
        public decimal margenMinimoTarjetaCredito { get; set; }
        public decimal margenMinimoCredito { get; set; }
        public decimal margenMinimoIgualar { get; set; }
        public int unidadesLimite { get; set; }
        public int unidadesProyeccionVentas { get; set; }
        public decimal precioListaContado { get; set; }
        public decimal precioListaCredito { get; set; }
        public decimal precioPromocionContado { get; set; }
        public decimal precioPromocionTarjetaCredito { get; set; }
        public decimal precioPromocionCredito { get; set; }
        public decimal precioIgualarPrecio { get; set; }
        public decimal descuentoPromocionContado { get; set; }
        public decimal descuentoPromocionTarjetaCredito { get; set; }
        public decimal descuentoPromocionCredito { get; set; }
        public decimal descuentoIgualarPrecio { get; set; }
        public decimal margenPrecioListaContado { get; set; }
        public decimal margenPrecioListaCredito { get; set; }
        public decimal margenPromocionContado { get; set; }
        public decimal margenPromocionTarjetaCredito { get; set; }
        public decimal margenPromocionCredito { get; set; }
        public decimal margenIgualarPrecio { get; set; }

        [RegularExpression("^[SN]$")]
        public string marcaRegalo { get; set; } = "N";

        // Listas internas (Sub-entidades)
        public List<MedioPagoDto> mediosPago { get; set; } = new List<MedioPagoDto>();
        public List<ArticuloAcuerdoDto>? acuerdos { get; set; }
        public List<OtroCostoDto>? otrosCostos { get; set; }
    }

    public class MedioPagoDto
    {
        public string tipoAsignacion { get; set; } = "T";
        public List<string> codigos { get; set; } = new List<string>();
    }

    public class ArticuloAcuerdoDto
    {
        public int idAcuerdo { get; set; }
        public decimal valorAporte { get; set; }
    }

    public class OtroCostoDto
    {
        public int codigoParametro { get; set; }
        public decimal costo { get; set; }
    }





    public class AcuerdoBandAproDTO
    {
        public int IDPROMOCIONACUERDO { get; set; }
        public int IDPROMOCION { get; set; }
        public int IDACUERDO { get; set; }
        public string descripcion_acuerdo { get; set; }
        public string nombre_proveedor { get; set; }
        public decimal porcentaje_descuento { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_disponible { get; set; }
        public decimal valor_liquidado { get; set; }
        public int id_estado_detalle { get; set; }
        public string nombre_estado_detalle { get; set; }
        public string etiqueta_estado_detalle { get; set; }
        public string etiqueta_tipo_fondo { get; set; }
        public string etiqueta_clase_acuerdo { get; set; }
    }

    public class InactivarPromocionRequest
    {
        public int IdPromocion { get; set; }
        public string? NombreUsuarioIngreso { get; set; }

        public int? IdOpcion { get; set; }
        public string? IdControlInterfaz { get; set; }
        public string? IdEvento { get; set; }
        public string? NombreUsuario { get; set; }

    }


    public class ActualizarPromocionRequest
    {
        public int IdPromocion { get; set; }
        public string ClasePromocion { get; set; } // 'PRGENERAL', 'PRARTICULO' o 'PRCOMBO'
        public PromocionModDto Promocion { get; set; }
        public List<AcuerdoModDto> Acuerdos { get; set; }
        public List<SegmentoDTO> Segmentos { get; set; }
        public string? NombreArchivoSoporte { get; set; }
        public string? ArchivoSoporteBase64 { get; set; }
        public string? rutaArchivoAntiguo { get; set; }

        //public string ArchivoSoporte { get; set; }
        public int IdTipoProceso { get; set; }

        // Parámetros para el LOG
        public int IdOpcion { get; set; }
        public string IdControlInterfaz { get; set; }
        public string IdEventoEtiqueta { get; set; }
    }

    public class PromocionModDto
    {
        public string Descripcion { get; set; }
        public int Motivo { get; set; }
        public DateTime FechaHoraInicio { get; set; } // Formato ISO: YYYY-MM-DDTHH:mm:ss.fffZ
        public DateTime FechaHoraFin { get; set; }
        public string MarcaRegalo { get; set; } // "S" o "N"
        public string IdUsuarioModifica { get; set; }
        public string NombreUsuario { get; set; }
    }

    public class AcuerdoModDto
    {
        public string Accion { get; set; } // 'I', 'U', 'D'
        public int? IdPromocionAcuerdo { get; set; } // Solo para 'U' y 'D'
        public int IdAcuerdo { get; set; }
        public decimal PorcentajeDescuento { get; set; }
        public decimal ValorComprometido { get; set; }
        public string? etiqueta_tipo_fondo { get; set; }
    }


}
