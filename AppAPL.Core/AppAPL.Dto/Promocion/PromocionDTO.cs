
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
        public int CODIGO { get; set; }
        public string NOMBRE { get; set; }
        public decimal VALOR { get; set; }

    }

    public class GrupoAlmacenDTO
    {
        public string CODIGOGRUPO { get; set; }
        public string NOMBREGRUPO { get; set; }
        //public string CODIGOALMACEN { get; set; }
        //public string NOMBREALMACEN { get; set; }
    }

    public class CanalDTO
    {
        public string CODIGO { get; set; }
        public string NOMBRE { get; set; }
    }

    public class ArticuloPrecioCompetenciaDTO
    {
        public string ARTICULO { get; set; }
        public string NOMBRE_COMPETENCIA { get; set; }
        public decimal PRECIO_CONTADO { get; set; }
    }

    public class ArticuloEquivalenteDTO
    {
        public string codigo { get; set; }
        public string descripcion { get; set; }
        public decimal costo { get; set; }
        public int stock_bodega { get; set; }
        public int stock_tiendas { get; set; }
        public int unidades_disponibles { get; set; }
        public int inventario_optimo { get; set; }
        public decimal excedentes_unidades { get; set; }
        public decimal excedentes_dolares { get; set; }

        public int m0_unidades { get; set; }
        public decimal m0_dolares { get; set; }
        public int m1_unidades { get; set; }
        public decimal m1_dolares { get; set; }
        public int m2_unidades { get; set; }
        public decimal m2_dolares { get; set; }
        public int m12_unidades { get; set; }
        public decimal m12_dolares { get; set; }

        public decimal igualar_precio { get; set; }
        public decimal dias_antiguedad { get; set; }

        public decimal margen_min_contado { get; set; }
        public decimal margen_min_tarjeta_credito { get; set; }
        public decimal margen_min_precio_credito { get; set; }
        public decimal margen_min_igualar { get; set; }

        public decimal precio_lista_contado { get; set; }
        public decimal precio_lista_credito { get; set; }

        public string marca { get; set; }
        public string division { get; set; }
        public string departamento { get; set; }
        public string clase { get; set; }
    }

    public class AlmacenDTO
    {
        //public string CODIGOGRUPO { get; set; }
        //public string NOMBREGRUPO { get; set; }
        public string CODIGOALMACEN { get; set; }
        public string NOMBREALMACEN { get; set; }
    }

    public class MedioPagoDTO
    {
        public string CODIGO { get; set; }
        public string DESCRIPCION { get; set; }
    }


    public class GruposPromocionesDTO
    {
        public IEnumerable<CanalDTO> Canales { get; set; } = Enumerable.Empty<CanalDTO>();
        //public IEnumerable<AlmacenDTO> Almacenes { get; set; } = Enumerable.Empty<AlmacenDTO>();
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
        public int? idpromocionsegmento { get; set; }
        public int? idpromocion { get; set; }
        public int? idtiposegmento { get; set; }
        public string? nombre_tipo_segmento { get; set; }
        public string? etiqueta_tipo_segmento { get; set; }
        public string? tipoasignacion { get; set; }
        public string? descripcion_asignacion { get; set; }
        public int? id_estado_segmento { get; set; }
        public string? nombre_estado_segmento { get; set; }


        public int? idpromocionsegmentodetalle { get; set; }
        public string? codigo_detalle { get; set; }
        public string? nombre_detalle { get; set; }
        public int? id_estado_detalle { get; set; }
        public string? nombre_estado_detalle { get; set; }
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
        public List<AcuerdoBandInacDTO>? acuerdos { get; set; }

        public List<ArticuloBandInacPromoDTO>? articulos { get; set; }
        public List<ArticuloSegmentoInacDTO>? articulosSegmentos { get; set; }
        public List<ArticuloAcuerdoPromoInacDTO>? articulosAcuerdos { get; set; }
        public List<ArticuloOtrosCostosInacDTO>? articulosOtros { get; set; }


        public string? tipopromocion { get; set; }
        [JsonIgnore]
        public int? codigoSalida { get; set; }
        [JsonIgnore]
        public string? mensajeSalida { get; set; }
    }

    public class CabeceraBandInacPromoDTO
    {

        public int? IdPromocion { get; set; }
        public string? Descripcion { get; set; }
        public int id_motivo { get; set; }
        public string nombre_motivo { get; set; }
        public int id_clase_promocion { get; set; }
        public string nombre_clase_promocion { get; set; }
        public string etiqueta_clase_promocion { get; set; }
        public string MarcaRegalo { get; set; }
        public string MarcaProcesoAprobacion { get; set; }
        public int? NumeroLoteAprobacion { get; set; }
        public string? ArchivoSoporte { get; set; }


        public int? cantidad_acuerdos { get; set; }
        public int? cantidad_articulos { get; set; }


        public DateTime? fecha_inicio { get; set; }
        public DateTime? fecha_fin { get; set; }

        public int id_estado_promocion { get; set; }
        public string nombre_estado_promocion { get; set; }
        public string etiqueta_estado_promocion { get; set; }

    }

    /*
    public class SegmentoBandInacDTO
    {
        // Campos de la tabla apl_tb_promocionsegmento (seg)
        public int? idpromocionsegmento { get; set; }
        public int? idpromocion { get; set; }
        public int? idtiposegmento { get; set; }
        public string? nombre_tipo_segmento { get; set; }
        public string? etiqueta_tipo_segmento { get; set; }
        public string? tipoasignacion { get; set; }
        public string? descripcion_asignacion { get; set; }
        public int? id_estado_segmento { get; set; }
        public string? nombre_estado_segmento { get; set; }


        public int? idpromocionsegmentodetalle { get; set; }
        public string? codigo_detalle { get; set; }
        public string? nombre_detalle { get; set; }
        public int? id_estado_detalle { get; set; }
        public string? nombre_estado_detalle { get; set; }
    }*/

    public class AcuerdoBandInacDTO
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

    public class ArticuloBandInacPromoDTO
    {
        public int idpromocionarticulo { get; set; }
        public int idpromocion { get; set; }
        public int? idpromocioncombo { get; set; }

        // --- Campos de Artículo (Caso PRARTICULO) ---
        public string codigoitem { get; set; }
        public string descripcion { get; set; }
        public decimal? costo { get; set; }
        public int? stockbodega { get; set; }
        public int? stocktienda { get; set; }
        public int? inventariooptimo { get; set; }
        public int? excedenteunidad { get; set; }
        public decimal? excedentevalor { get; set; }

        public int? m0unidades { get; set; }
        public decimal? m0precio { get; set; }
        public int? m1unidades { get; set; }
        public decimal? m1precio { get; set; }
        public int? m2unidades { get; set; }
        public decimal? m2precio { get; set; }
        public int? m12unidades { get; set; }
        public decimal? m12precio { get; set; }

        public decimal? igualarprecio { get; set; }
        public decimal? diasantinguedad { get; set; }
        public decimal? margenminimocontado { get; set; }
        public decimal? margenminimotarjetacredito { get; set; }
        public decimal? margenminimocredito { get; set; }
        public decimal? margenminimoigualar { get; set; }
        public decimal? unidadeslimite { get; set; }
        public decimal? unidadesproyeccionventas { get; set; }

        public decimal? preciolistacontado { get; set; }
        public decimal? preciolistacredito { get; set; }
        public decimal? preciopromocioncontado { get; set; }
        public decimal? preciopromociontarjetacredito { get; set; }
        public decimal? preciopromocioncredito { get; set; }
        public decimal? precioigualarprecio { get; set; }

        public decimal? descuentopromocioncontado { get; set; }
        public decimal? descuentopromociontarjetacredito { get; set; }
        public decimal? descuentopromocioncredito { get; set; }
        public decimal? descuentoigualarprecio { get; set; }

        public decimal? margenpreciolistacontado { get; set; }
        public decimal? margenpreciolistacredito { get; set; }
        public decimal? margenpromocioncontado { get; set; }
        public decimal? margenpromociontarjetacredito { get; set; }
        public decimal? margenpromocioncredito { get; set; }
        public decimal? margenigualarprecio { get; set; }
        public string marcaregalo { get; set; }
        public int? id_estado_articulo { get; set; }
        public string nombre_estado_articulo { get; set; }
        public string etiqueta_estado_articulo { get; set; }

        // --- Campos de Cabecera de Combo (Caso PRCOMBO) ---
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }
        public decimal? costo_combo { get; set; }
        public decimal? combo_margen_min_contado { get; set; }
        public decimal? combo_margen_min_tc { get; set; }
        public decimal? combo_margen_min_credito { get; set; }
        public decimal? combo_margen_min_igualar { get; set; }
        public int? combo_unidades_limite { get; set; }
        public int? combo_unidades_proyeccion { get; set; }
        public decimal? combo_precio_lista_contado { get; set; }
        public decimal? combo_precio_lista_credito { get; set; }
        public decimal? combo_precio_promo_contado { get; set; }
        public decimal? combo_precio_promo_tc { get; set; }
        public decimal? combo_precio_promo_credito { get; set; }
        public decimal? combo_desc_promo_contado { get; set; }
        public decimal? combo_desc_promo_tc { get; set; }
        public decimal? combo_desc_promo_credito { get; set; }
        public decimal? combo_margen_pl_contado { get; set; }
        public decimal? combo_margen_pl_credito { get; set; }
        public decimal? combo_margen_promo_contado { get; set; }
        public decimal? combo_margen_promo_tc { get; set; }
        public decimal? combo_margen_promo_credito { get; set; }
        public string? combo_marca_regalo { get; set; }
        public int? id_estado_combo { get; set; }
        public string? nombre_estado_combo { get; set; }
        public string? etiqueta_estado_combo { get; set; }

        // --- Campos de Componentes de Combo (Caso PRCOMBO - pac) ---
        public int? idpromocionarticulocomponente { get; set; }
        public string? comp_codigo_item { get; set; }
        public string? comp_descripcion { get; set; }
        public decimal? comp_costo { get; set; }
        public int? comp_stock_bodega { get; set; }
        public int? comp_stock_tienda { get; set; }
        public int? comp_inventario_optimo { get; set; }
        public int? comp_excedente_unidad { get; set; }
        public decimal? comp_excedente_valor { get; set; }
        public int? comp_m0_unidades { get; set; }
        public decimal? comp_m0_precio { get; set; }
        public int? comp_m1_unidades { get; set; }
        public decimal? comp_m1_precio { get; set; }
        public int? comp_m2_unidades { get; set; }
        public decimal? comp_m2_precio { get; set; }
        public int? comp_m12_unidades { get; set; }
        public decimal? comp_m12_precio { get; set; }
        public string? comp_igualar_precio { get; set; }
        public int? comp_dias_antiguedad { get; set; }
        public decimal? comp_margen_min_contado { get; set; }
        public decimal? comp_margen_min_tc { get; set; }
        public decimal? comp_margen_min_credito { get; set; }
        public decimal? comp_margen_min_igualar { get; set; }
        public decimal? comp_precio_lista_contado { get; set; }
        public decimal? comp_precio_lista_credito { get; set; }
        public decimal? comp_precio_promo_contado { get; set; }
        public decimal? comp_precio_promo_tc { get; set; }
        public decimal? comp_precio_promo_credito { get; set; }
        public decimal? comp_desc_promo_contado { get; set; }
        public decimal? comp_desc_promo_tc { get; set; }
        public decimal? comp_desc_promo_credito { get; set; }
        public decimal? comp_margen_pl_contado { get; set; }
        public decimal? comp_margen_pl_credito { get; set; }
        public decimal? comp_margen_promo_contado { get; set; }
        public decimal? comp_margen_promo_tc { get; set; }
        public decimal? comp_margen_promo_credito { get; set; }
        public int? comp_id_estado { get; set; }
        public string? comp_nombre_estado { get; set; }
        public string? comp_etiqueta_estado { get; set; }
    }

    public class ArticuloSegmentoInacDTO
    {
        public int idpromocionarticulosegmento { get; set; }
        public int idpromocionarticulo { get; set; }

        // Dependiendo de si es PRARTICULO o PRCOMBO vendrán poblados unos u otros
        public string? codigoitem { get; set; }
        public string? descripcion_articulo { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }

        public int? idtiposegmento { get; set; }
        public string? nombre_tipo_segmento { get; set; }
        public string? etiqueta_tipo_segmento { get; set; }
        public string? tipoasignacion { get; set; }
        public string? descripcion_asignacion { get; set; }
        public int? id_estado_segmento { get; set; }
        public string? nombre_estado_segmento { get; set; }
        public int? idpromocionarticulosegmentodetalle { get; set; }
        public string? codigo_detalle { get; set; }
        public string? nombre_medio_pago { get; set; }
        public int? id_estado_detalle { get; set; }
        public string? nombre_estado_detalle { get; set; }

    }

    public class ArticuloAcuerdoPromoInacDTO
    {
        public int? idpromocionarticuloacuerdo { get; set; }
        public int? idpromocionarticulocomponenteacuerdo { get; set; }
        public int? idpromocionarticulo { get; set; }
        public int? idpromocionarticulocomponente { get; set; }
        public string? codigoitem { get; set; }
        public string? descripcion_articulo { get; set; }

        public int? idacuerdo { get; set; }
        public string? descripcion_acuerdo { get; set; }
        public string? nombre_proveedor { get; set; }
        public string? etiqueta_tipo_fondo { get; set; }
        public string? nombre_tipo_fondo { get; set; }
        public string? etiqueta_clase_acuerdo { get; set; }
        public string? nombre_clase_acuerdo { get; set; }

        public decimal? valor_aporte { get; set; }
        public decimal? valor_comprometido { get; set; }
        public decimal? valor_disponible { get; set; }
        public decimal? valor_liquidado { get; set; }

        public int? id_estado_detalle { get; set; }
        public string? nombre_estado_detalle { get; set; }
        public string? etiqueta_estado_detalle { get; set; }

        //CAMPOS PARA COMBO
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }
        public string? comp_codigo_item { get; set; }
        public string? comp_descripcion { get; set; }
    }

    public class ArticuloOtrosCostosInacDTO
    {
        public int? idpromocionarticulootroscostos { get; set; }
        public int? idpromocionarticulocomponenteotroscostos { get; set; }
        public int idpromocionarticulo { get; set; }
        public int? idpromocionarticulocomponente { get; set; }
        public string codigoparametro { get; set; }
        public string? descripcion { get; set; }
        public string? descripcion_parametro { get; set; }
        public decimal costo { get; set; }
        public int estadoregistro { get; set; }

        //CAMPOS PARA COMBO
        public string codigo_combo { get; set; }
        public string comp_codigo_item { get; set; }
        public string comp_descripcion { get; set; }
    }


    //BANDEJA GENERAL POR ID

    public class BandGenPromocionIDDTO
    {
        // Lista para capturar el cursor p_cursor_cabecera
        public CabeceraBandGenPromoDTO? cabecera { get; set; }
        public List<SegmentoBandejaDTO>? segmentos { get; set; }
        public List<AcuerdoBandGenDTO>? acuerdos { get; set; }

        public List<ArticuloBandGenPromoDTO>? articulos { get; set; }
        public List<ArticuloSegmentoGenDTO>? articulosSegmento { get; set; }
        public List<ArticuloSegmentoDetalleGenDTO>? articulosSegmentoDetalle { get; set; }
        public List<ArticuloAcuerdoPromoGenDTO>? articulosAcuerdos { get; set; }
        public List<ArticuloOtrosCostosGenDTO>? articulosOtros { get; set; }

        public List<ArticuloComponenteGenDTO>? articulosComponente { get; set; }
        public List<ArticuloCompAcuerdoGenDTO>? articulosCompAcuerdos { get; set; }
        public List<ArticuloCompOtrosCostosGenDTO>? articulosCompOtrosCostos { get; set; }

        public string? clase_promocion { get; set; }
        [JsonIgnore]
        public int? codigoSalida { get; set; }
        [JsonIgnore]
        public string? mensajeSalida { get; set; }
    }

    public class CabeceraBandGenPromoDTO
    {

        public int? IdPromocion { get; set; }
        public string? Descripcion { get; set; }
        public int id_motivo { get; set; }
        public string nombre_motivo { get; set; }
        public int id_clase_promocion { get; set; }
        public string nombre_clase_promocion { get; set; }
        public string etiqueta_clase_promocion { get; set; }
        public string MarcaRegalo { get; set; }
        public string MarcaProcesoAprobacion { get; set; }
        public int? NumeroLoteAprobacion { get; set; }
        public string? ArchivoSoporte { get; set; }


        public int? cantidad_acuerdos { get; set; }
        public int? cantidad_articulos { get; set; }


        public DateTime? fecha_inicio { get; set; }
        public DateTime? fecha_fin { get; set; }

        public int id_estado_promocion { get; set; }
        public string nombre_estado_promocion { get; set; }
        public string etiqueta_estado_promocion { get; set; }

    }

    public class AcuerdoBandGenDTO
    {
        public int? IDPROMOCIONACUERDO { get; set; }
        public int? IDPROMOCION { get; set; }
        public int? IDACUERDO { get; set; }
        public string? descripcion_acuerdo { get; set; }
        public string? nombre_proveedor { get; set; }
        public decimal? porcentaje_descuento { get; set; }
        public decimal? valor_comprometido { get; set; }
        public decimal? valor_disponible { get; set; }
        public decimal? valor_liquidado { get; set; }
        public long? id_estado_acuerdo { get; set; }
        public string? nombre_estado_acuerdo { get; set; }
        public string? etiqueta_estado_acuerdo { get; set; }
        public string? etiqueta_tipo_fondo { get; set; }
        public string? etiqueta_clase_acuerdo { get; set; }
    }

    public class ArticuloBandGenPromoDTO
    {
        public long? idpromocionarticulo { get; set; }
        public long? idpromocion { get; set; }
        public long? idpromocioncombo { get; set; }

        // Alias que cambian según sea PRARTICULO o PRCOMBO
        public string? codigoitem { get; set; }
        public string? codigo_combo { get; set; }

        public string? descripcion { get; set; }
        public string? descripcion_combo { get; set; }

        public decimal? costo { get; set; }
        public decimal? costo_combo { get; set; }

        public int? stockbodega { get; set; }
        public int? stocktienda { get; set; }
        public int? inventariooptimo { get; set; }
        public int? excedenteunidad { get; set; }
        public decimal? excedentevalor { get; set; }
        public int? m0unidades { get; set; }
        public decimal? m0precio { get; set; }
        public int? m1unidades { get; set; }
        public decimal? m1precio { get; set; }
        public int? m2unidades { get; set; }
        public decimal? m2precio { get; set; }
        public int? m12unidades { get; set; }
        public decimal? m12precio { get; set; }
        public string? igualarprecio { get; set; }
        public int? diasantinguedad { get; set; }

        public decimal? margenminimocontado { get; set; }
        public decimal? combo_margen_min_contado { get; set; }

        public decimal? margenminimotarjetacredito { get; set; }
        public decimal? combo_margen_min_tc { get; set; }

        public decimal? margenminimocredito { get; set; }
        public decimal? combo_margen_min_credito { get; set; }

        public decimal? margenminimoigualar { get; set; }
        public decimal? combo_margen_min_igualar { get; set; }

        public int? unidadeslimite { get; set; }
        public int? combo_unidades_limite { get; set; }

        public int? unidadesproyeccionventas { get; set; }
        public int? combo_unidades_proyeccion { get; set; }

        public decimal? preciolistacontado { get; set; }
        public decimal? combo_precio_lista_contado { get; set; }

        public decimal? preciolistacredito { get; set; }
        public decimal? combo_precio_lista_credito { get; set; }

        public decimal? preciopromocioncontado { get; set; }
        public decimal? combo_precio_promo_contado { get; set; }

        public decimal? preciopromociontarjetacredito { get; set; }
        public decimal? combo_precio_promo_tc { get; set; }

        public decimal? preciopromocioncredito { get; set; }
        public decimal? combo_precio_promo_credito { get; set; }

        public decimal? precioigualarprecio { get; set; }

        public decimal? descuentopromocioncontado { get; set; }
        public decimal? combo_desc_promo_contado { get; set; }

        public decimal? descuentopromociontarjetacredito { get; set; }
        public decimal? combo_desc_promo_tc { get; set; }

        public decimal? descuentopromocioncredito { get; set; }
        public decimal? combo_desc_promo_credito { get; set; }

        public decimal? descuentoigualarprecio { get; set; }

        public decimal? margenpreciolistacontado { get; set; }
        public decimal? combo_margen_pl_contado { get; set; }

        public decimal? margenpreciolistacredito { get; set; }
        public decimal? combo_margen_pl_credito { get; set; }

        public decimal? margenpromocioncontado { get; set; }
        public decimal? combo_margen_promo_contado { get; set; }

        public decimal? margenpromociontarjetacredito { get; set; }
        public decimal? combo_margen_promo_tc { get; set; }

        public decimal? margenpromocioncredito { get; set; }
        public decimal? combo_margen_promo_credito { get; set; }

        public decimal? margenigualarprecio { get; set; }

        public string? marcaregalo { get; set; }
        public string? combo_marca_regalo { get; set; }

        public long? id_estado_articulo { get; set; }
        public long? id_estado_combo { get; set; }

        public string? nombre_estado_articulo { get; set; }
        public string? nombre_estado_combo { get; set; }

        public string? etiqueta_estado_articulo { get; set; }
        public string? etiqueta_estado_combo { get; set; }
    }

    public class ArticuloSegmentoGenDTO
    {
        public long? idpromocionarticulosegmento { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }
        public long? idtiposegmento { get; set; }
        public string? nombre_tipo_segmento { get; set; }
        public string? etiqueta_tipo_segmento { get; set; }
        public string? tipoasignacion { get; set; }
        public string? descripcion_asignacion { get; set; }
        public long? id_estado_segmento { get; set; }
        public string? nombre_estado_segmento { get; set; }

    }
    public class ArticuloSegmentoDetalleGenDTO
    {
        public long? idpromocionarticulosegmentodetalle { get; set; }
        public long? idpromocionarticulosegmento { get; set; }
        public long? idpromocionarticulo { get; set; }

        // Alias que varían según el tipo
        public string? codigoitem { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_articulo { get; set; }
        public string? descripcion_combo { get; set; }

        public string? codigo_medio_pago { get; set; }
        public string? nombre_medio_pago { get; set; }
        public long? id_estado_detalle { get; set; }
        public string? nombre_estado_detalle { get; set; }
    }

    public class ArticuloAcuerdoPromoGenDTO
    {
        public long? idpromocionarticuloacuerdo { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigoitem { get; set; }
        public string? descripcion_articulo { get; set; }
        public long? idacuerdo { get; set; }
        public string? descripcion_acuerdo { get; set; }
        public string? nombre_proveedor { get; set; }
        public string? etiqueta_tipo_fondo { get; set; }
        public string? nombre_tipo_fondo { get; set; }
        public string? etiqueta_clase_acuerdo { get; set; }
        public string? nombre_clase_acuerdo { get; set; }
        public decimal? valor_aporte { get; set; }
        public decimal? valor_comprometido { get; set; }
        public decimal? valor_liquidado { get; set; }
        public long? id_estado_acuerdo { get; set; }
        public string? nombre_estado_acuerdo { get; set; }
        public string? etiqueta_estado_acuerdo { get; set; }
    }

    public class ArticuloOtrosCostosGenDTO
    {
        public long? idpromocionarticulootroscostos { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigoitem { get; set; }
        public string? descripcion_articulo { get; set; }
        public string? codigoparametro { get; set; }
        public string? descripcion_parametro { get; set; }
        public decimal? costo { get; set; }
        public long? id_estado_otros_costos { get; set; }
    }

    public class ArticuloComponenteGenDTO
    {
        public long? idpromocionarticulocomponente { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }

        public string? componente_codigoitem { get; set; }
        public string? componente_descripcion { get; set; }
        public decimal? componente_costo { get; set; }
        public int? componente_stock_bodega { get; set; }
        public int? componente_stock_tienda { get; set; }
        public int? componente_inventario_optimo { get; set; }
        public int? componente_excedente_unidad { get; set; }
        public decimal? componente_excedente_valor { get; set; }

        public int? componente_m0_unidades { get; set; }
        public decimal? componente_m0_precio { get; set; }
        public int? componente_m1_unidades { get; set; }
        public decimal? componente_m1_precio { get; set; }
        public int? componente_m2_unidades { get; set; }
        public decimal? componente_m2_precio { get; set; }
        public int? componente_m12_unidades { get; set; }
        public decimal? componente_m12_precio { get; set; }

        public string? componente_igualar_precio { get; set; }
        public int? componente_dias_antiguedad { get; set; }

        public decimal? componente_margen_min_contado { get; set; }
        public decimal? componente_margen_min_tc { get; set; }
        public decimal? componente_margen_min_credito { get; set; }
        public decimal? componente_margen_min_igualar { get; set; }

        public decimal? componente_precio_lista_contado { get; set; }
        public decimal? componente_precio_lista_credito { get; set; }
        public decimal? componente_precio_promo_contado { get; set; }
        public decimal? componente_precio_promo_tc { get; set; }
        public decimal? componente_precio_promo_credito { get; set; }

        public decimal? componente_desc_promo_contado { get; set; }
        public decimal? componente_desc_promo_tc { get; set; }
        public decimal? componente_desc_promo_credito { get; set; }

        public decimal? componente_margen_pl_contado { get; set; }
        public decimal? componente_margen_pl_credito { get; set; }
        public decimal? componente_margen_promo_contado { get; set; }
        public decimal? componente_margen_promo_tc { get; set; }
        public decimal? componente_margen_promo_credito { get; set; }

        public long? componente_id_estado { get; set; }
        public string? componente_nombre_estado { get; set; }
        public string? componente_etiqueta_estado { get; set; }
    }

    public class ArticuloCompAcuerdoGenDTO
    {
        public long? idpromocionarticulocomponenteacuerdo { get; set; }
        public long? idpromocionarticulocomponente { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }
        public string? componente_codigoitem { get; set; }
        public string? componente_descripcion { get; set; }

        public long? idacuerdo { get; set; }
        public string? descripcion_acuerdo { get; set; }
        public string? nombre_proveedor { get; set; }
        public string? etiqueta_tipo_fondo { get; set; }
        public string? nombre_tipo_fondo { get; set; }
        public string? etiqueta_clase_acuerdo { get; set; }
        public string? nombre_clase_acuerdo { get; set; }

        public decimal? valor_aporte { get; set; }
        public decimal? valor_comprometido { get; set; }
        public decimal? valor_disponible { get; set; }
        public decimal? valor_liquidado { get; set; }

        public long? id_estado_acuerdo { get; set; }
        public string? nombre_estado_acuerdo { get; set; }
        public string? etiqueta_estado_acuerdo { get; set; }
    }

    public class ArticuloCompOtrosCostosGenDTO
    {
        public long? idpromocionarticulocomponenteotroscostos { get; set; }
        public long? idpromocionarticulocomponente { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }
        public string? componente_codigoitem { get; set; }
        public string? componente_descripcion { get; set; }

        public string? codigoparametro { get; set; }
        public string? descripcion_parametro { get; set; }
        public decimal? costo { get; set; }
        public long? id_estado_otros_costos { get; set; }
    }




    //BANDEJA MODIFICACION POR ID

    public class BandModPromocionIDDTO
    {
        // Lista para capturar el cursor p_cursor_cabecera
        public CabeceraBandModPromoDTO? cabecera { get; set; }
        public List<SegmentoBandModDTO>? segmentos { get; set; }
        public List<AcuerdoBandModDTO>? acuerdos { get; set; }
        

        public List<ArticuloBandModPromoDTO>? articulos { get; set; }


        public List<ArticuloBandModSegmentoDTO> articulosSegmento { get; set; } = new();
        public List<ArticuloBandModSegmentoDetalleDTO> articulosSegmentoDetalle { get; set; } = new();

        public List<ArticuloAcuerdoModDTO>? articulosAcuerdos { get; set; }
        public List<ArticuloOtrosCostosModDTO>? articulosOtrosCostos { get; set; }

        public List<ArticuloComponenteModDTO> articulosComponentes { get; set; } = new();
        public List<ArticuloComponenteAcuerdoModDTO> articulosCompAcuerdo { get; set; } = new();
        public List<ArticuloComponenteOtrosCostosModDTO> articulosCompOtrosCostos { get; set; } = new();



        public string? tipopromocion { get; set; }
        [JsonIgnore]
        public int? codigoSalida { get; set; }
        [JsonIgnore]
        public string? mensajeSalida { get; set; }
    }

    public class CabeceraBandModPromoDTO
    {
        //public string Solicitud { get; set; }
        public int? IdPromocion { get; set; }
        public string? Descripcion { get; set; }
        public int? id_motivo { get; set; }
        public string? nombre_motivo { get; set; }
        public int? id_clase_promocion { get; set; }
        public string? nombre_clase_promocion { get; set; }
        public string? etiqueta_clase_promocion { get; set; }
        public string? MarcaRegalo { get; set; }
        public string? MarcaProcesoAprobacion { get; set; }
        public int? NumeroLoteAprobacion { get; set; }
        public string? ArchivoSoporte { get; set; }

        // Dependiendo de si es PRGENERAL o PRARTICULO/PRCOMBO
        public int? cantidad_acuerdos { get; set; }
        public int? cantidad_articulos { get; set; }

        public string? fecha_inicio { get; set; }
        public string? fecha_fin { get; set; }

        public int? id_estado_promocion { get; set; }
        public string? nombre_estado_promocion { get; set; }
        public string? etiqueta_estado_promocion { get; set; }
       
    }

    public class SegmentoBandModDTO
    {
        // Campos de la tabla apl_tb_promocionsegmento (seg)
        public int? idpromocionsegmento { get; set; }
        public int? idpromocion { get; set; }
        public int? idtiposegmento { get; set; }
        public string? nombre_tipo_segmento { get; set; }
        public string? etiqueta_tipo_segmento { get; set; }
        public string? tipoasignacion { get; set; }
        public string? descripcion_asignacion { get; set; }
        public int? id_estado_segmento { get; set; }
        public string? nombre_estado_segmento { get; set; }


        public int? idpromocionsegmentodetalle { get; set; }
        public string? codigo_detalle { get; set; }
        public string? nombre_detalle { get; set; }
        public int? id_estado_detalle { get; set; }
        public string? nombre_estado_detalle { get; set; }
    }

    public class AcuerdoBandModDTO
    {
        public int? idpromocionacuerdo { get; set; }
        public int? idpromocion { get; set; }
        public int? idacuerdo { get; set; }
        public string? descripcion_acuerdo { get; set; }
        public string? nombre_proveedor { get; set; }
        public decimal? porcentaje_descuento { get; set; }
        public decimal? valor_comprometido { get; set; }
        public decimal? valor_disponible { get; set; }
        public decimal? valor_liquidado { get; set; }
        public int? id_estado_acuerdo { get; set; }
        public string? nombre_estado_acuerdo { get; set; }
        public string? etiqueta_estado_acuerdo { get; set; }
        public string? etiqueta_tipo_fondo { get; set; }
        public string? etiqueta_clase_acuerdo { get; set; }
    }


    public class ArticuloBandModPromoDTO
    {
        public long? idpromocionarticulo { get; set; }
        public long? idpromocion { get; set; }
        public long? idpromocioncombo { get; set; }

        public string? codigoitem { get; set; }
        public string? codigo_combo { get; set; }

        public string? descripcion { get; set; }
        public string? descripcion_combo { get; set; }

        public decimal? costo { get; set; }
        public decimal? costo_combo { get; set; }

        public int? stockbodega { get; set; }
        public int? stocktienda { get; set; }
        public int? inventariooptimo { get; set; }
        public int? excedenteunidad { get; set; }
        public decimal? excedentevalor { get; set; }
        public int? m0unidades { get; set; }
        public decimal? m0precio { get; set; }
        public int? m1unidades { get; set; }
        public decimal? m1precio { get; set; }
        public int? m2unidades { get; set; }
        public decimal? m2precio { get; set; }
        public int? m12unidades { get; set; }
        public decimal? m12precio { get; set; }
        public string? igualarprecio { get; set; }
        public int? diasantinguedad { get; set; }

        public decimal? margenminimocontado { get; set; }
        public decimal? combo_margen_min_contado { get; set; }

        public decimal? margenminimotarjetacredito { get; set; }
        public decimal? combo_margen_min_tc { get; set; }

        public decimal? margenminimocredito { get; set; }
        public decimal? combo_margen_min_credito { get; set; }

        public decimal? margenminimoigualar { get; set; }
        public decimal? combo_margen_min_igualar { get; set; }

        public int? unidadeslimite { get; set; }
        public int? combo_unidades_limite { get; set; }

        public int? unidadesproyeccionventas { get; set; }
        public int? combo_unidades_proyeccion { get; set; }

        public decimal? preciolistacontado { get; set; }
        public decimal? combo_precio_lista_contado { get; set; }

        public decimal? preciolistacredito { get; set; }
        public decimal? combo_precio_lista_credito { get; set; }

        public decimal? preciopromocioncontado { get; set; }
        public decimal? combo_precio_promo_contado { get; set; }

        public decimal? preciopromociontarjetacredito { get; set; }
        public decimal? combo_precio_promo_tc { get; set; }

        public decimal? preciopromocioncredito { get; set; }
        public decimal? combo_precio_promo_credito { get; set; }

        public decimal? precioigualarprecio { get; set; }

        public decimal? descuentopromocioncontado { get; set; }
        public decimal? combo_desc_promo_contado { get; set; }

        public decimal? descuentopromociontarjetacredito { get; set; }
        public decimal? combo_desc_promo_tc { get; set; }

        public decimal? descuentopromocioncredito { get; set; }
        public decimal? combo_desc_promo_credito { get; set; }

        public decimal? descuentoigualarprecio { get; set; }

        public decimal? margenpreciolistacontado { get; set; }
        public decimal? combo_margen_pl_contado { get; set; }

        public decimal? margenpreciolistacredito { get; set; }
        public decimal? combo_margen_pl_credito { get; set; }

        public decimal? margenpromocioncontado { get; set; }
        public decimal? combo_margen_promo_contado { get; set; }

        public decimal? margenpromociontarjetacredito { get; set; }
        public decimal? combo_margen_promo_tc { get; set; }

        public decimal? margenpromocioncredito { get; set; }
        public decimal? combo_margen_promo_credito { get; set; }

        public decimal? margenigualarprecio { get; set; }

        public string? marcaregalo { get; set; }
        public string? combo_marca_regalo { get; set; }

        public long? id_estado_articulo { get; set; }
        public long? id_estado_combo { get; set; }

        public string? nombre_estado_articulo { get; set; }
        public string? nombre_estado_combo { get; set; }

        public string? etiqueta_estado_articulo { get; set; }
        public string? etiqueta_estado_combo { get; set; }
    }

    public class ArticuloBandModSegmentoDTO
    {
        public long? idpromocionarticulosegmento { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }
        public long? idtiposegmento { get; set; }
        public string? nombre_tipo_segmento { get; set; }
        public string? etiqueta_tipo_segmento { get; set; }
        public string? tipoasignacion { get; set; }
        public string? descripcion_asignacion { get; set; }
        public long? id_estado_segmento { get; set; }
        public string? nombre_estado_segmento { get; set; }
    }

    public class ArticuloBandModSegmentoDetalleDTO
    {
        public long? idpromocionarticulosegmentodetalle { get; set; }
        public long? idpromocionarticulosegmento { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigoitem { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_articulo { get; set; }
        public string? descripcion_combo { get; set; }
        public string? codigo_medio_pago { get; set; }
        public string? nombre_medio_pago { get; set; }
        public long? id_estado_detalle { get; set; }
        public string? nombre_estado_detalle { get; set; }
    }

    public class ArticuloAcuerdoModDTO
    {
        public long? idpromocionarticuloacuerdo { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigoitem { get; set; }
        public string? descripcion_articulo { get; set; }
        public long? idacuerdo { get; set; }
        public string? descripcion_acuerdo { get; set; }
        public string? nombre_proveedor { get; set; }
        public string? etiqueta_tipo_fondo { get; set; }
        public string? nombre_tipo_fondo { get; set; }
        public string? etiqueta_clase_acuerdo { get; set; }
        public string? nombre_clase_acuerdo { get; set; }
        public decimal? valor_aporte { get; set; }
        public decimal? valor_comprometido { get; set; }
        public decimal? valor_liquidado { get; set; }
        public long? id_estado_acuerdo { get; set; }
        public string? nombre_estado_acuerdo { get; set; }
        public string? etiqueta_estado_acuerdo { get; set; }
    }

    public class ArticuloOtrosCostosModDTO
    {
        public long? idpromocionarticulootroscostos { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigoitem { get; set; }
        public string? descripcion_articulo { get; set; }
        public string? codigoparametro { get; set; }
        public string? descripcion_parametro { get; set; }
        public decimal? costo { get; set; }
        public long? id_estado_otros_costos { get; set; }
    }

    public class ArticuloComponenteModDTO
    {
        public long? idpromocionarticulocomponente { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }
        public string? componente_codigoitem { get; set; }
        public string? componente_descripcion { get; set; }
        public decimal? componente_costo { get; set; }
        public int? componente_stock_bodega { get; set; }
        public int? componente_stock_tienda { get; set; }
        public int? componente_inventario_optimo { get; set; }
        public int? componente_excedente_unidad { get; set; }
        public decimal? componente_excedente_valor { get; set; }

        public int? componente_m0_unidades { get; set; }
        public decimal? componente_m0_precio { get; set; }
        public int? componente_m1_unidades { get; set; }
        public decimal? componente_m1_precio { get; set; }
        public int? componente_m2_unidades { get; set; }
        public decimal? componente_m2_precio { get; set; }
        public int? componente_m12_unidades { get; set; }
        public decimal? componente_m12_precio { get; set; }

        public string? componente_igualar_precio { get; set; }
        public int? componente_dias_antiguedad { get; set; }

        public decimal? componente_margen_min_contado { get; set; }
        public decimal? componente_margen_min_tc { get; set; }
        public decimal? componente_margen_min_credito { get; set; }
        public decimal? componente_margen_min_igualar { get; set; }

        public decimal? componente_precio_lista_contado { get; set; }
        public decimal? componente_precio_lista_credito { get; set; }
        public decimal? componente_precio_promo_contado { get; set; }
        public decimal? componente_precio_promo_tc { get; set; }
        public decimal? componente_precio_promo_credito { get; set; }

        public decimal? componente_desc_promo_contado { get; set; }
        public decimal? componente_desc_promo_tc { get; set; }
        public decimal? componente_desc_promo_credito { get; set; }

        public decimal? componente_margen_pl_contado { get; set; }
        public decimal? componente_margen_pl_credito { get; set; }
        public decimal? componente_margen_promo_contado { get; set; }
        public decimal? componente_margen_promo_tc { get; set; }
        public decimal? componente_margen_promo_credito { get; set; }

        public long? componente_id_estado { get; set; }
        public string? componente_nombre_estado { get; set; }
        public string? componente_etiqueta_estado { get; set; }
    }

    public class ArticuloComponenteAcuerdoModDTO
    {
        public long? idpromocionarticulocomponenteacuerdo { get; set; }
        public long? idpromocionarticulocomponente { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }
        public string? componente_codigoitem { get; set; }
        public string? componente_descripcion { get; set; }

        public long? idacuerdo { get; set; }
        public string? descripcion_acuerdo { get; set; }
        public string? nombre_proveedor { get; set; }
        public string? etiqueta_tipo_fondo { get; set; }
        public string? nombre_tipo_fondo { get; set; }
        public string? etiqueta_clase_acuerdo { get; set; }
        public string? nombre_clase_acuerdo { get; set; }

        public decimal? valor_aporte { get; set; }
        public decimal? valor_comprometido { get; set; }
        public decimal? valor_disponible { get; set; }
        public decimal? valor_liquidado { get; set; }

        public long? id_estado_acuerdo { get; set; }
        public string? nombre_estado_acuerdo { get; set; }
        public string? etiqueta_estado_acuerdo { get; set; }
    }

    public class ArticuloComponenteOtrosCostosModDTO
    {
        public long? idpromocionarticulocomponenteotroscostos { get; set; }
        public long? idpromocionarticulocomponente { get; set; }
        public long? idpromocionarticulo { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }
        public string? componente_codigoitem { get; set; }
        public string? componente_descripcion { get; set; }

        public string? codigoparametro { get; set; }
        public string? descripcion_parametro { get; set; }
        public decimal? costo { get; set; }
        public long? id_estado_otros_costos { get; set; }
    }


    //BANDEJA APROBACION POR ID
    public class BandAproPromocionIDDTO
    {
        // Lista para capturar el cursor p_cursor_cabecera
        public CabeceraBandAproPromoDTO? cabecera { get; set; }
        public List<SegmentoBandejaDTO>? segmentos { get; set; }
        public List<AcuerdoBandAproDTO>? acuerdos { get; set; }

        // Lista para capturar el cursor p_cursor_articulos
        public List<ArticuloBandAproPromoDTO>? articulos { get; set; }

        public List<ArticuloSegmentoAproDTO>? articulosSegmentos { get; set; }
        public List<ArticuloAcuerdoPromoAproDTO>? articulosAcuerdos { get; set; }
        public List<ArticuloOtrosCostosAproDTO>? articulosOtros { get; set; }

        public string? tipopromocion { get; set; }
        [JsonIgnore]
        public int? codigoSalida { get; set; }
        [JsonIgnore]
        public string? mensajeSalida { get; set; }
    }

    public class CabeceraBandAproPromoDTO
    {
        public string? Solicitud { get; set; }
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

        public int? cantidad_acuerdos { get; set; }
        public int? cantidad_articulos { get; set; }


        public DateTime fecha_inicio { get; set; }
        public DateTime fecha_fin { get; set; }
        public int id_estado_promocion { get; set; }
        public string nombre_estado_promocion { get; set; }
        public string etiqueta_estado_promocion { get; set; }


        public int? nivelaprobacion { get; set; }
        public string? aprobador { get; set; }
        public int? idaprobacion { get; set; }
        public int? id_entidad { get; set; }
        public string? entidad_etiqueta { get; set; }
        public int? id_tipo_proceso { get; set; }
        public string? tipo_proceso_etiqueta { get; set; }
        public string? estado_aprob_etiqueta { get; set; }
    }

    public class ArticuloBandAproPromoDTO
    {
        public int idpromocionarticulo { get; set; }
        public int idpromocion { get; set; }
        public int? idpromocioncombo { get; set; }

        // --- Campos de Artículo (Caso PRARTICULO) ---
        public string codigoitem { get; set; }
        public string descripcion { get; set; }
        public decimal? costo { get; set; }
        public int? stockbodega { get; set; }
        public int? stocktienda { get; set; }
        public int? inventariooptimo { get; set; }
        public int? excedenteunidad { get; set; }
        public decimal? excedentevalor { get; set; }

        public int? m0unidades { get; set; }
        public decimal? m0precio { get; set; }
        public int? m1unidades { get; set; }
        public decimal? m1precio { get; set; }
        public int? m2unidades { get; set; }
        public decimal? m2precio { get; set; }
        public int? m12unidades { get; set; }
        public decimal? m12precio { get; set; }

        public decimal? igualarprecio { get; set; }
        public decimal? diasantinguedad { get; set; }
        public decimal? margenminimocontado { get; set; }
        public decimal? margenminimotarjetacredito { get; set; }
        public decimal? margenminimocredito { get; set; }
        public decimal? margenminimoigualar { get; set; }
        public decimal? unidadeslimite { get; set; }
        public decimal? unidadesproyeccionventas { get; set; }

        public decimal? preciolistacontado { get; set; }
        public decimal? preciolistacredito { get; set; }
        public decimal? preciopromocioncontado { get; set; }
        public decimal? preciopromociontarjetacredito { get; set; }
        public decimal? preciopromocioncredito { get; set; }
        public decimal? precioigualarprecio { get; set; }

        public decimal? descuentopromocioncontado { get; set; }
        public decimal? descuentopromociontarjetacredito { get; set; }
        public decimal? descuentopromocioncredito { get; set; }
        public decimal? descuentoigualarprecio { get; set; }

        public decimal? margenpreciolistacontado { get; set; }
        public decimal? margenpreciolistacredito { get; set; }
        public decimal? margenpromocioncontado { get; set; }
        public decimal? margenpromociontarjetacredito { get; set; }
        public decimal? margenpromocioncredito { get; set; }
        public decimal? margenigualarprecio { get; set; }
        public string marcaregalo { get; set; }
        public int? id_estado_articulo { get; set; }
        public string nombre_estado_articulo { get; set; }
        public string etiqueta_estado_articulo { get; set; }

        // --- Campos de Cabecera de Combo (Caso PRCOMBO) ---
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }
        public decimal? costo_combo { get; set; }
        public decimal? combo_margen_min_contado { get; set; }
        public decimal? combo_margen_min_tc { get; set; }
        public decimal? combo_margen_min_credito { get; set; }
        public decimal? combo_margen_min_igualar { get; set; }
        public int? combo_unidades_limite { get; set; }
        public int? combo_unidades_proyeccion { get; set; }
        public decimal? combo_precio_lista_contado { get; set; }
        public decimal? combo_precio_lista_credito { get; set; }
        public decimal? combo_precio_promo_contado { get; set; }
        public decimal? combo_precio_promo_tc { get; set; }
        public decimal? combo_precio_promo_credito { get; set; }
        public decimal? combo_desc_promo_contado { get; set; }
        public decimal? combo_desc_promo_tc { get; set; }
        public decimal? combo_desc_promo_credito { get; set; }
        public decimal? combo_margen_pl_contado { get; set; }
        public decimal? combo_margen_pl_credito { get; set; }
        public decimal? combo_margen_promo_contado { get; set; }
        public decimal? combo_margen_promo_tc { get; set; }
        public decimal? combo_margen_promo_credito { get; set; }
        public string? combo_marca_regalo { get; set; }
        public int? id_estado_combo { get; set; }
        public string? nombre_estado_combo { get; set; }
        public string? etiqueta_estado_combo { get; set; }

        // --- Campos de Componentes de Combo (Caso PRCOMBO - pac) ---
        public int? idpromocionarticulocomponente { get; set; }
        public string? comp_codigo_item { get; set; }
        public string? comp_descripcion { get; set; }
        public decimal? comp_costo { get; set; }
        public int? comp_stock_bodega { get; set; }
        public int? comp_stock_tienda { get; set; }
        public int? comp_inventario_optimo { get; set; }
        public int? comp_excedente_unidad { get; set; }
        public decimal? comp_excedente_valor { get; set; }
        public int? comp_m0_unidades { get; set; }
        public decimal? comp_m0_precio { get; set; }
        public int? comp_m1_unidades { get; set; }
        public decimal? comp_m1_precio { get; set; }
        public int? comp_m2_unidades { get; set; }
        public decimal? comp_m2_precio { get; set; }
        public int? comp_m12_unidades { get; set; }
        public decimal? comp_m12_precio { get; set; }
        public string? comp_igualar_precio { get; set; }
        public int? comp_dias_antiguedad { get; set; }
        public decimal? comp_margen_min_contado { get; set; }
        public decimal? comp_margen_min_tc { get; set; }
        public decimal? comp_margen_min_credito { get; set; }
        public decimal? comp_margen_min_igualar { get; set; }
        public decimal? comp_precio_lista_contado { get; set; }
        public decimal? comp_precio_lista_credito { get; set; }
        public decimal? comp_precio_promo_contado { get; set; }
        public decimal? comp_precio_promo_tc { get; set; }
        public decimal? comp_precio_promo_credito { get; set; }
        public decimal? comp_desc_promo_contado { get; set; }
        public decimal? comp_desc_promo_tc { get; set; }
        public decimal? comp_desc_promo_credito { get; set; }
        public decimal? comp_margen_pl_contado { get; set; }
        public decimal? comp_margen_pl_credito { get; set; }
        public decimal? comp_margen_promo_contado { get; set; }
        public decimal? comp_margen_promo_tc { get; set; }
        public decimal? comp_margen_promo_credito { get; set; }
        public int? comp_id_estado { get; set; }
        public string? comp_nombre_estado { get; set; }
        public string? comp_etiqueta_estado { get; set; }
    }


    public class ArticuloSegmentoAproDTO
    {
        public int idpromocionarticulosegmento { get; set; }
        public int idpromocionarticulo { get; set; }

        // Dependiendo de si es PRARTICULO o PRCOMBO vendrán poblados unos u otros
        public string? codigoitem { get; set; }
        public string? descripcion_articulo { get; set; }
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }

        public int? idtiposegmento { get; set; }
        public string? nombre_tipo_segmento { get; set; }
        public string? etiqueta_tipo_segmento { get; set; }
        public string? tipoasignacion { get; set; }
        public string? descripcion_asignacion { get; set; }
        public int? id_estado_segmento { get; set; }
        public string? nombre_estado_segmento { get; set; }
        public int? idpromocionarticulosegmentodetalle { get; set; }
        public string? codigo_detalle { get; set; }
        public string? nombre_medio_pago { get; set; }
        public int? id_estado_detalle { get; set; }
        public string? nombre_estado_detalle { get; set; }
        
    }

    public class ArticuloAcuerdoPromoAproDTO
    {
        public int? idpromocionarticuloacuerdo { get; set; }
        public int? idpromocionarticulocomponenteacuerdo { get; set; }
        public int? idpromocionarticulo { get; set; }
        public int? idpromocionarticulocomponente { get; set; }
        public string? codigoitem { get; set; }
        public string? descripcion_articulo { get; set; }
       
        public int? idacuerdo { get; set; }
        public string? descripcion_acuerdo { get; set; }
        public string? nombre_proveedor { get; set; }
        public string? etiqueta_tipo_fondo { get; set; }
        public string? nombre_tipo_fondo { get; set; }
        public string? etiqueta_clase_acuerdo { get; set; }
        public string? nombre_clase_acuerdo { get; set; }

        public decimal? valor_aporte { get; set; }
        public decimal? valor_comprometido { get; set; }
        public decimal? valor_disponible { get; set; }
        public decimal? valor_liquidado { get; set; }

        public int? id_estado_detalle { get; set; }
        public string? nombre_estado_detalle { get; set; }
        public string? etiqueta_estado_detalle { get; set; }

        //CAMPOS PARA COMBO
        public string? codigo_combo { get; set; }
        public string? descripcion_combo { get; set; }
        public string? comp_codigo_item { get; set; }
        public string? comp_descripcion { get; set; }
    }


    public class ArticuloOtrosCostosAproDTO
    {
        public int? idpromocionarticulootroscostos { get; set; }
        public int? idpromocionarticulocomponenteotroscostos { get; set; }
        public int idpromocionarticulo { get; set; }
        public int? idpromocionarticulocomponente { get; set; }
        public string codigoparametro { get; set; }
        public string? descripcion { get; set; }
        public string? descripcion_parametro { get; set; }
        public decimal costo { get; set; }
        public int estadoregistro { get; set; }

        //CAMPOS PARA COMBO
        public string codigo_combo { get; set; }
        public string comp_codigo_item { get; set; }
        public string comp_descripcion { get; set; }
    }



    //------------------------------------------------------------------


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
        public PromocionDataDTO Promocion { get; set; }
        public List<AcuerdoDTO> Acuerdos { get; set; }
        public List<SegmentoDTO> Segmentos { get; set; }
        public List<ArticuloDTO>? Articulos { get; set; }
        public List<ArticuloComponenteWrapperDto>? articulos_componentes { get; set; }
    }

    public class PromocionDataDTO
    {
        public string descripcion { get; set; } = string.Empty;
        public int motivo { get; set; }
        public int clasePromocion { get; set; }
        public DateTime fechaHoraInicio { get; set; }
        public DateTime fechaHoraFin { get; set; }
        public string? marcaRegalo { get; set; }
        public string? marcaProcesoAprobacion { get; set; }
        public string idUsuarioIngreso { get; set; } = string.Empty;
        public string nombreUsuario { get; set; } = string.Empty;
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
        public string tipoSegmento { get; set; } = string.Empty;
        public string tipoAsignacion { get; set; } = string.Empty;
        public List<string>? codigos { get; set; }
    }


    public class ArticuloDTO
    {
        public string? codigoItem { get; set; }
        public string? descripcion { get; set; }
        public string? descripcionCombo { get; set; } // Viene en PRCOMBO

        public decimal costo { get; set; }
        public int? stockBodega { get; set; }
        public int? stockTienda { get; set; }
        public int? inventarioOptimo { get; set; }
        public int? excedenteUnidad { get; set; }
        public decimal? excedenteValor { get; set; }

        public int? m0Unidades { get; set; }
        public decimal? m0Precio { get; set; }
        public int? m1Unidades { get; set; }
        public decimal? m1Precio { get; set; }
        public int? m2Unidades { get; set; }
        public decimal? m2Precio { get; set; }
        public decimal? m12Unidades { get; set; }
        public decimal? m12Precio { get; set; }

        public decimal? igualarPrecio { get; set; }
        public int? diasAntiguedad { get; set; }

        public decimal? margenMinimoContado { get; set; }
        public decimal? margenMinimoTarjetaCredito { get; set; }
        public decimal? margenMinimoCredito { get; set; }
        public decimal? margenMinimoIgualar { get; set; }
        public decimal? margenMinimoIgualarPrecio { get; set; } // Viene en PRCOMBO

        public int? unidadesLimite { get; set; }
        public int? unidadesProyeccionVentas { get; set; }
        public int? proyeccionVentas { get; set; } // Viene en PRCOMBO

        public decimal? precioListaContado { get; set; }
        public decimal? precioListaCredito { get; set; }
        public decimal? precioPromocionContado { get; set; }
        public decimal? precioPromocionTarjetaCredito { get; set; }
        public decimal? precioPromocionCredito { get; set; }
        public decimal? precioIgualarPrecio { get; set; }

        public decimal? descuentoPromocionContado { get; set; }
        public decimal? descuentoPromocionTarjetaCredito { get; set; }
        public decimal? descuentoPromocionCredito { get; set; }
        public decimal? descuentoIgualarPrecio { get; set; }

        public decimal? margenPrecioListaContado { get; set; }
        public decimal? margenPrecioListaCredito { get; set; }
        public decimal? margenPromocionContado { get; set; }
        public decimal? margenPromocionTarjetaCredito { get; set; }
        public decimal? margenPromocionCredito { get; set; }
        public decimal? margenIgualarPrecio { get; set; }

        public string? marcaRegalo { get; set; }
        public string? regalo { get; set; } // Viene en PRCOMBO

        public List<MedioPagoArticuloDto>? mediosPago { get; set; }
        public List<AcuerdoArticuloDto>? acuerdos { get; set; }
        public List<OtroCostoArticuloDto>? otrosCostos { get; set; }
    }

    public class AcuerdoArticuloDto
    {
        public int idAcuerdo { get; set; }
        public decimal valorAporte { get; set; }
        public decimal valorComprometido { get; set; }
    }

    public class MedioPagoArticuloDto
    {
        public string tipoAsignacion { get; set; } = string.Empty;
        public List<string>? codigos { get; set; }
    }

    public class OtroCostoArticuloDto
    {
        public int codigoParametro { get; set; }
        public decimal costo { get; set; }
    }

    public class OtroCostoComponenteDto
    {
        // OJO: En la cabecera era 'codigoParametro' y 'costo', aquí cambian:
        public int? codigo { get; set; }
        public decimal? costos { get; set; }
    }

    public class ArticuloAcuerdoDto
    {
        public int? idAcuerdo { get; set; }
        public decimal? valorAporte { get; set; }
        public decimal? valorComprometido { get; set; }
    }

    public class OtroCostoDto
    {
        public int? codigoParametro { get; set; }
        public decimal? costo { get; set; }
    }

    // $. p_json_articulos_componentes
    public class ArticuloComponenteWrapperDto
    {
        public int rnArticulo { get; set; }
        public List<ComponenteDetalleDto> componentes { get; set; } = new();
    }

    public class ComponenteDetalleDto
    {
        public string codigoArticulo { get; set; } = string.Empty;
        public string descripcion { get; set; } = string.Empty;
        public decimal costo { get; set; }

        public int? stockBodega { get; set; }
        public int? stockTienda { get; set; }
        public int? inventarioOptimo { get; set; }
        public int? excedenteU { get; set; }
        public decimal? excedenteUSD { get; set; }

        public int? ventaHistoricaM0U { get; set; }
        public decimal? ventaHistoricaM0USD { get; set; }
        public int? ventaHistoricaM1U { get; set; }
        public decimal? ventaHistoricaM1USD { get; set; }
        public int? ventaHistoricaM2U { get; set; }
        public decimal? ventaHistoricaM2USD { get; set; }
        public decimal? ventaHistoricaM12U { get; set; }
        public decimal? ventaHistoricaM12USD { get; set; }

        public decimal? igualarPrecio { get; set; }
        public int? diasAntiguedad { get; set; }

        public decimal? margenMinimoContado { get; set; }
        public decimal? margenMinimoTarjetaCredito { get; set; }
        public decimal? margenMinimoPrecioCredito { get; set; }
        public decimal? margenMinimoIgualar { get; set; }

        public decimal? precioListaContado { get; set; }
        public decimal? precioListaCredito { get; set; }
        public decimal? precioPromocionContado { get; set; }
        public decimal? precioPromocionTarjetaCredito { get; set; }
        public decimal? precioPromocionCredito { get; set; }

        public decimal? descuentoPromocionContado { get; set; }
        public decimal? descuentoPromocionTarjetaCredito { get; set; }
        public decimal? descuentoPromocionCredito { get; set; }

        public decimal? margenPrecioListaContado { get; set; }
        public decimal? margenPrecioListaCredito { get; set; }
        public decimal? margenPromocionContado { get; set; }
        public decimal? margenPromocionTarjetaCredito { get; set; }
        public decimal? margenPromocionCredito { get; set; }

        public List<ArticuloAcuerdoDto>? jsonAcuerdos { get; set; }
        public List<OtroCostoComponenteDto>? jsonOtrosCostos { get; set; }
    }


    // modificar promocion articulo dto -------------------------------------

    public class ArticuloModPromocionDTO
    {
        public string accion { get; set; } = string.Empty;
        public int? idPromocionArticulo { get; set; }

        // Nombres extraídos para PRARTICULO
        public string? codigoItem { get; set; }
        public string? descripcion { get; set; }
        public int? unidadesProyeccionVentas { get; set; }
        public decimal? margenMinimoIgualar { get; set; }
        public decimal? precioIgualarPrecio { get; set; }
        public decimal? descuentoIgualarPrecio { get; set; }
        public decimal? margenIgualarPrecio { get; set; }
        public string? marcaRegalo { get; set; }

        // Nombres extraídos para PRCOMBO
        public string? descripcionCombo { get; set; }
        public int? proyeccionVentas { get; set; }
        public decimal? margenMinimoIgualarPrecio { get; set; }
        public string? regalo { get; set; }

        // Compartidos
        public decimal? costo { get; set; }
        public int? stockBodega { get; set; }
        public int? stockTienda { get; set; }
        public int? inventarioOptimo { get; set; }
        public int? excedenteUnidad { get; set; }
        public decimal? excedenteValor { get; set; }
        public int? m0Unidades { get; set; }
        public decimal? m0Precio { get; set; }
        public int? m1Unidades { get; set; }
        public decimal? m1Precio { get; set; }
        public int? m2Unidades { get; set; }
        public decimal? m2Precio { get; set; }
        public decimal? m12Unidades { get; set; }
        public decimal? m12Precio { get; set; }
        public decimal? igualarPrecio { get; set; }
        public int? diasAntiguedad { get; set; }
        public decimal? margenMinimoContado { get; set; }
        public decimal? margenMinimoTarjetaCredito { get; set; }
        public decimal? margenMinimoCredito { get; set; }
        public int? unidadesLimite { get; set; }
        public decimal? precioListaContado { get; set; }
        public decimal? precioListaCredito { get; set; }
        public decimal? precioPromocionContado { get; set; }
        public decimal? precioPromocionTarjetaCredito { get; set; }
        public decimal? precioPromocionCredito { get; set; }
        public decimal? descuentoPromocionContado { get; set; }
        public decimal? descuentoPromocionTarjetaCredito { get; set; }
        public decimal? descuentoPromocionCredito { get; set; }
        public decimal? margenPrecioListaContado { get; set; }
        public decimal? margenPrecioListaCredito { get; set; }
        public decimal? margenPromocionContado { get; set; }
        public decimal? margenPromocionTarjetaCredito { get; set; }
        public decimal? margenPromocionCredito { get; set; }

        // Nodos anidados
        public List<MedioPagoArticuloDto>? mediosPago { get; set; }
        public List<ArticuloAcuerdoDto>? acuerdos { get; set; }
        public List<OtroCostoDto>? otrosCostos { get; set; }
    }



    //--------------------------



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
        public List<ArticuloModPromocionDTO>? Articulos { get; set; }
        public List<ComponenteRootDto>? articulos_componentes { get; set; }


        public string? NombreArchivoSoporte { get; set; }
        public string? ArchivoSoporteBase64 { get; set; }
        public string rutaArchivoAntiguo { get; set; }

        public int IdTipoProceso { get; set; }

        // Parámetros para el LOG
        public int IdOpcion { get; set; }
        public string IdControlInterfaz { get; set; }
        public string IdEventoEtiqueta { get; set; }
    }

    public class PromocionModDto
    {
        public string Descripcion { get; set; } = string.Empty;
        public int Motivo { get; set; }
        public DateTime FechaHoraInicio { get; set; } // Formato ISO: YYYY-MM-DDTHH:mm:ss.fffZ
        public DateTime FechaHoraFin { get; set; }
        public string? MarcaRegalo { get; set; }
        public string? IdUsuarioModifica { get; set; } = string.Empty;
        public string? IdUsuarioIngreso { get; set; } = string.Empty;
        public string? NombreUsuario { get; set; } = string.Empty;
    }

    public class AcuerdoModDto
    {
        public string Accion { get; set; } // 'I', 'U', 'D'
        public int? IdPromocionAcuerdo { get; set; } // Solo para 'U' y 'D'
        public int? IdAcuerdo { get; set; }
        public decimal? PorcentajeDescuento { get; set; }
        public decimal? ValorComprometido { get; set; }
        public string? etiqueta_tipo_fondo { get; set; }
    }

    public class ComponenteRootDto
    {
        public string accion { get; set; } = string.Empty;
        public List<ComponenteDetalleModDto>? jsonArticulosComponentes { get; set; }
    }

    public class ComponenteDetalleModDto
    {
        public string? accion { get; set; }
        public int? idPromocionArticuloComponente { get; set; }
        public string? codigoArticulo { get; set; }
        public string? descripcion { get; set; }
        public decimal? costo { get; set; }
        public int? stockBodega { get; set; }
        public int? stockTienda { get; set; }
        public int? inventarioOptimo { get; set; }
        public int? excedenteU { get; set; }
        public decimal? excedenteUSD { get; set; }
        public int? ventaHistoricaM0U { get; set; }
        public decimal? ventaHistoricaM0USD { get; set; }
        public int? ventaHistoricaM1U { get; set; }
        public decimal? ventaHistoricaM1USD { get; set; }
        public int? ventaHistoricaM2U { get; set; }
        public decimal? ventaHistoricaM2USD { get; set; }
        public decimal? ventaHistoricaM12U { get; set; }
        public decimal? ventaHistoricaM12USD { get; set; }
        public decimal? igualarPrecio { get; set; }
        public int? diasAntiguedad { get; set; }
        public decimal? margenMinimoContado { get; set; }
        public decimal? margenMinimoTarjetaCredito { get; set; }
        public decimal? margenMinimoPrecioCredito { get; set; }
        public decimal? margenMinimoIgualar { get; set; }
        public decimal? precioListaContado { get; set; }
        public decimal? precioListaCredito { get; set; }
        public decimal? precioPromocionContado { get; set; }
        public decimal? precioPromocionTarjetaCredito { get; set; }
        public decimal? precioPromocionCredito { get; set; }
        public decimal? descuentoPromocionContado { get; set; }
        public decimal? descuentoPromocionTarjetaCredito { get; set; }
        public decimal? descuentoPromocionCredito { get; set; }
        public decimal? margenPrecioListaContado { get; set; }
        public decimal? margenPrecioListaCredito { get; set; }
        public decimal? margenPromocionContado { get; set; }
        public decimal? margenPromocionTarjetaCredito { get; set; }
        public decimal? margenPromocionCredito { get; set; }

        public List<ComponenteAcuerdoDto>? jsonAcuerdos { get; set; }
        public List<ComponenteOtroCostoDto>? jsonOtrosCostos { get; set; }
    }

    public class ComponenteAcuerdoDto
    {
        public int? idAcuerdo { get; set; }
        public decimal? valorAporte { get; set; }
        public decimal? valorComprometido { get; set; }
    }

    public class ComponenteOtroCostoDto
    {
        public int? codigo { get; set; }
        public decimal? costos { get; set; }
    }

}
