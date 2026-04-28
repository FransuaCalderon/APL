using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Parametrizacion
{
    public class ParametroConfigDTO
    {
        public int idparametrotipo { get; set; }

        public int idparametro { get; set; }

       
        public int codigoparametro { get; set; }

        public string nombre { get; set; }
    }

    public class GruposAlmacenConfigDTO
    {
        public int idparametrotipo { get; set; }

        public int idparametro { get; set; }

        
        public string? codigoparametro { get; set; }

        public string? nombre { get; set; }
    }

    public class AlmacenesGrupoConfigDTO
    {
        public int idparametrodato { get; set; }

        public int idparametro { get; set; }

        
        public int codigoparametro { get; set; }

        
        public string? codigo_almacen { get; set; }

        public string? nombre_almacen { get; set; }
    }

    public class MediosPagoConfigDTO
    {
        public int idparametro { get; set; }

       
        public int codigoparametro { get; set; }

        public string? nombre { get; set; }
    }

    public class AportesMarcaDTO
    {
        public int idparametrodato { get; set; }

        public int idparametro { get; set; }

        public int codigoparametro { get; set; }

        
        public string? codigo_marca { get; set; }

        public string? nombre_marca { get; set; }

        
        public string? Numero_Aporte { get; set; }
    }

    public class AportesMarcaProvDTO
    {
        public int idparametrodato { get; set; }

        public int idparametro { get; set; }

        public int codigoparametro { get; set; }

        public string? codigo_marca { get; set; }

        public string? nombre_marca { get; set; }

       
        public string? identificacion_proveedor { get; set; }

        public string? nombre_proveedor { get; set; }

        public string? Numero_Aporte { get; set; }
    }

    public class AportesArticuloDTO
    {
        public int idparametrodato { get; set; }

        public int idparametro { get; set; }

        public int codigoparametro { get; set; }

        
        public string? codigo_articulo { get; set; }

        public string? nombre_articulo { get; set; }

        public string? Numero_Aporte { get; set; }
    }

    public class PreciosCompetenciaDTO
    {
        public int idparametrodato { get; set; }

        public int idparametro { get; set; }

        public int codigoparametro { get; set; }

        public string? codigo_articulo { get; set; }

        public string? nombre_articulo { get; set; }

        public string? nombre_competencia { get; set; }

        
        public string? Precio_Contado { get; set; }
    }

    public class MargenMinimoDTO
    {
        public int idparametrodato { get; set; }

        public int idparametro { get; set; }

        public int codigoparametro { get; set; }

        public string? codigo_articulo { get; set; }

        public string? nombre_articulo { get; set; }

        
        public string? margen_minimo_Contado { get; set; }

        public string? margen_minimo_tarjeta_credito { get; set; }

        public string? margen_minimo_credito { get; set; }

        public string? margen_minimo_igualar_precio { get; set; }
    }

    public class PorcIncrementoDTO
    {
        public int idparametrodato { get; set; }

        public int idparametro { get; set; }

        public int codigoparametro { get; set; }

       
        public string? porcentaje_incremento_tarjeta_credito { get; set; }

        public string? porcentaje_incremento_credito { get; set; }
    }

    public class OtrosCostosConfigDTO
    {
        public int idparametrodato { get; set; }

        public int idparametro { get; set; }

        public int codigoparametro { get; set; }

        public string? nombre { get; set; }

        
        public string? Costo { get; set; }
    }

    public class MantenimientoParametrosRequestDTO
    {
       
        public int tipo_mant { get; set; }

      
        public string? opcion { get; set; }

        public int? idparametro { get; set; }

        public int? idparametrotipo { get; set; }

        public string? nombre { get; set; }

        public int? codigoparametro { get; set; }

        public string? idusuario { get; set; }

        public int? idparametrodato { get; set; }

        public string? codigorelacion1 { get; set; }

        public string? codigorelacion2 { get; set; }

        public string? codigorelacion3 { get; set; }

        public string? codigorelacion4 { get; set; }

        public string? codigorelacion5 { get; set; }

        
        public decimal? valor1 { get; set; }

        public decimal? valor2 { get; set; }

        public decimal? valor3 { get; set; }

        public decimal? valor4 { get; set; }

        public decimal? valor5 { get; set; }
    }

    public class MantenimientoParametrosResponseDTO
    {
        
        public int? idparametro { get; set; }

        public int? codigoparametro { get; set; }

        public int? idparametrodato { get; set; }

        
        public int? cod_respuesta { get; set; }

        public string? msg_respuesta { get; set; }
    }
}
