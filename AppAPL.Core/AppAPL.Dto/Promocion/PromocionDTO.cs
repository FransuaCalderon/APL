
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
}
