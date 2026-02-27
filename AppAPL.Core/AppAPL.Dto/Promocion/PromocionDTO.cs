
using AppAPL.Dto.Acuerdo;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
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
        public IEnumerable<SegmentoBandejaDTO> segmentos { get; set; }
        public IEnumerable<AcuerdoBandAproDTO>? acuerdos { get; set; }

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
        public IEnumerable<AcuerdoBandAproDTO>? acuerdos { get; set; }

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
        public IEnumerable<AcuerdoBandAproDTO>? acuerdos { get; set; }
        public IEnumerable<SegmentoBandejaDTO>? segmentos { get; set; }

        // Lista para capturar el cursor p_cursor_articulos
        //public IEnumerable<ArticuloBandAproPromoDTO>? articulos { get; set; }

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
        public List<AcuerdoBandAproDTO>? acuerdos { get; set; }

        // Lista para capturar el cursor p_cursor_articulos
        public List<ArticuloBandAproPromoDTO>? articulos { get; set; }
        
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
        public int IdPromocionAcuerdo { get; set; }
        public int IdPromocion { get; set; }
        public int IdAcuerdo { get; set; }
        public string descripcion_acuerdo { get; set; }
        public decimal porcentaje_descuento { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_disponible { get; set; }
        public decimal valor_liquidado { get; set; }
        public int id_estado_detalle { get; set; }
        public string nombre_estado_detalle { get; set; }
        public string etiqueta_estado_detalle { get; set; }
    }

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
        public long IdOpcion { get; set; }
        public string IdControlInterfaz { get; set; } = string.Empty;
        public string IdEventoEtiqueta { get; set; } = string.Empty;

        public string? NombreArchivoSoporte { get; set; }
        public string? ArchivoSoporteBase64 { get; set; }

        // Objetos que se enviarán como JSON (CLOB) al SP
        public PromocionDataDTO Promocion { get; set; } = new();
        public List<AcuerdoDTO>? Acuerdos { get; set; }
        public List<SegmentoDTO>? Segmentos { get; set; }
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
        
    }

    public class SegmentoDTO
    {
        public string TipoSegmento { get; set; } = string.Empty; // Ej: "SEGMARCA"
        public string TipoAsignacion { get; set; } = "T";        // 'T' (Todos) o 'C' (Codigos)
        public List<string> Codigos { get; set; } = new();       // Array de strings ["001", "002"]
    }

    public class AcuerdoBandAproDTO
    {
        public int IDPROMOCIONACUERDO { get; set; }
        public int IDPROMOCION { get; set; }
        public int IDACUERDO { get; set; }
        public string descripcion_acuerdo { get; set; }
        public decimal porcentaje_descuento { get; set; }
        public decimal valor_comprometido { get; set; }
        public decimal valor_disponible { get; set; }
        public decimal valor_liquidado { get; set; }
        public int id_estado_detalle { get; set; }
        public string nombre_estado_detalle { get; set; }
        public string etiqueta_estado_detalle { get; set; }
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
        public long IdPromocion { get; set; }
        public string ClasePromocion { get; set; } // 'PRGENERAL', 'PRARTICULO' o 'PRCOMBO'
        public PromocionModDto Promocion { get; set; }
        public List<AcuerdoModDto> Acuerdos { get; set; }
        public List<SegmentoModDto> Segmentos { get; set; }
        public string? NombreArchivoSoporte { get; set; }
        public string? ArchivoSoporteBase64 { get; set; }

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
        public long? IdPromocionAcuerdo { get; set; } // Solo para 'U' y 'D'
        public int IdAcuerdo { get; set; }
        public decimal PorcentajeDescuento { get; set; }
        public decimal ValorComprometido { get; set; }
    }


    public class SegmentoModDto
    {
        public string TipoSegmento { get; set; }
        public string TipoAsignacion { get; set; } // 'T' (Todos) o 'S' (Seleccionados)
        public List<string> Codigos { get; set; } // EANs, IDs de Local, etc.
    }


}
