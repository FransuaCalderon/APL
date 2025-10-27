using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Fondos
{
    public class FondoDTO
    {
        public long IdFondo { get; set; }                    // NUMBER(18,0) Identity
        public string? Descripcion_Fondo { get; set; }        // VARCHAR2(100)
        public decimal? IdProveedor { get; set; }            // NUMBER(18,2)
        public decimal? Tipo_Fondo { get; set; }              // NUMBER(18,2)
        public decimal? Valor_Fondo { get; set; }             // NUMBER(18,2)
        public DateTime? Fecha_Inicio_Vigencia { get; set; }   // DATE
        public DateTime? Fecha_Fin_Vigencia { get; set; }      // DATE
        public decimal? Valor_Disponible { get; set; }        // NUMBER(18,2)
        public decimal? Valor_Comprometido { get; set; }      // NUMBER(18,2)
        public decimal? Valor_Liquidado { get; set; }        // NUMBER(18,2)
        public decimal? Estado_Registro { get; set; }         // NUMBER(18,2)
        public decimal? Indicador_Creacion { get; set; }      // NUMBER(18,2)
    }

    public class CrearActualizarFondoRequest
    {
        public string? Descripcion_Fondo { get; set; }        // VARCHAR2(100)
        public decimal? IdProveedor { get; set; }            // NUMBER(18,2)
        public decimal? Tipo_Fondo { get; set; }              // NUMBER(18,2)
        public decimal? Valor_Fondo { get; set; }             // NUMBER(18,2)
        public DateTime? Fecha_Inicio_Vigencia { get; set; }   // DATE
        public DateTime? Fecha_Fin_Vigencia { get; set; }      // DATE
        public decimal? Valor_Disponible { get; set; }        // NUMBER(18,2)
        public decimal? Valor_Comprometido { get; set; }      // NUMBER(18,2)
        public decimal? Valor_Liquidado { get; set; }        // NUMBER(18,2)
        public decimal? Estado_Registro { get; set; }         // NUMBER(18,2)
        public decimal? Indicador_Creacion { get; set; }      // NUMBER(18,2)
    }
}
