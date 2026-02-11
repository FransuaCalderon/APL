
using AppAPL.Dto.Acuerdo;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Promocion
{
    public class PromocionDTO
    {
        public int IDPROMOCION { get; set; }
        public string DESCRIPCION { get; set; }
        public int MOTIVO { get; set; }
        public int CLASEPROMOCION { get; set; }
        public DateTime FECHAHORAINICIO { get; set; }
        public DateTime FECHAHORAFIN { get; set; }
        public string MARCAREGALO { get; set; }
        public int ESTADOREGISTRO { get; set; }
        public string MARCAPROCESOAPROBACION { get; set; }
        public int NUMEROLOTEAPROBACION { get; set; }
        public string ARCHIVOSOPORTE { get; set; }
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

    public class BandInacPromocionDTO
    {
        public int IDAPROBACION { get; set; }
        public int ENTIDAD { get; set; }
        public int IDENTIDAD { get; set; }
        public int IDTIPOPROCESO { get; set; }
        public string IDUSERSOLICITUD { get; set; }
        public string NOMBREUSERSOLICITUD { get; set; }
        public DateTime FECHASOLICITUD { get; set; }
        public string IDUSERAPROBADOR { get; set; }
        public DateTime FECHAAPROBACION { get; set; }
        public string COMENTARIO { get; set; }
        public int NIVELAPROBACION { get; set; }
        public int IDESTADOREGISTRO { get; set; }
        public int NUMEROLOTEAPROBACION { get; set; }

        public int IDPROMOCION { get; set; }
        public string DESCRIPCION { get; set; }
        public int MOTIVO { get; set; }
        public int CLASEPROMOCION { get; set; }
        public DateTime FECHAHORAINICIO { get; set; }
        public DateTime FECHAHORAFIN { get; set; }
        public string MARCAREGALO { get; set; }
        public int ESTADOREGISTRO_PROMO { get; set; }
        public string MARCAPROCESOAPROBACION { get; set; }
        public int NUMEROLOTE_PROMO { get; set; }
        public string ARCHIVOSOPORTE { get; set; }
    }

    public class BandAproPromocionDTO
    {
        public int IDAPROBACION { get; set; }
        public int IDPROMOCION { get; set; }
        public int SOLICITUD { get; set; }
        public string NOMBRE_SOLICITUD { get; set; }
        public int IDUSERSOLICITUD { get; set; }
        public string USUARIOSOLICITA { get; set; }
        public DateTime FECHASOLICITUD { get; set; }
        public string IDUSERAPROBADOR { get; set; }
        public int NIVELAPROBACION { get; set; }
        public int ESTADOAPROBACION { get; set; }
        public int NUMEROLOTEAPROBACION { get; set; }

        public string DESCRIPCION { get; set; }
        public int MOTIVO { get; set; }
        public int CLASEPROMOCION { get; set; }
        public string NOMBRE_CLASE_PROMOCION { get; set; } //cc
        public DateTime FECHAHORAINICIO { get; set; }
        public DateTime FECHAHORAFIN { get; set; }
        public string MARCAREGALO { get; set; }
        public int ESTADOPROMOCION { get; set; }
        public string NOMBRE_ESTADO { get; set; }
    }

    public class CrearPromocionRequestDTO
    {
        // Parámetros directos
        public string TipoClaseEtiqueta { get; set; } = string.Empty;
        public long IdOpcion { get; set; }
        public string IdControlInterfaz { get; set; } = string.Empty;
        public string IdEventoEtiqueta { get; set; } = string.Empty;
        // Agregamos el archivo aquí para que todo viaje en un solo objeto
        public IFormFile? ArchivoSoporte { get; set; }

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
        public long IdAcuerdo { get; set; }
        public decimal PorcentajeDescuento { get; set; }
        public decimal ValorComprometido { get; set; }
    }

    public class SegmentoDTO
    {
        public string TipoSegmento { get; set; } = string.Empty; // Ej: "SEGMARCA"
        public string TipoAsignacion { get; set; } = "T";        // 'T' (Todos) o 'C' (Codigos)
        public List<string> Codigos { get; set; } = new();       // Array de strings ["001", "002"]
    }
}
