
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Promocion
{
    public class PromocionDTO
    {
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
