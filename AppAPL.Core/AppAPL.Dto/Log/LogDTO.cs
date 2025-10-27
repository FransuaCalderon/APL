using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Log
{
    public class LogDTO
    {
        public long IdLog { get; set; }               // NUMBER(18,0)
        public DateTime? FechaHoraTrx { get; set; }   // DATE (nullable por si DB permite null)
        public string? IdUser { get; set; }           // VARCHAR2(50)
        public int? IdOpcion { get; set; }            // NUMBER(10,0)

        public string Nombre_Opcion { get; set; }
        public string Descripcion_Opcion { get; set; }

        public int? IdEvento { get; set; }            // NUMBER(10,0)

        public string? Datos { get; set; }
    }

    public class CrearActualizarLogRequest
    {
        public string? IdUser { get; set; }
        public string? Nombre_Opcion { get; set; }
        public int? IdOpcion { get; set; }
        public int? IdEvento { get; set; }
        public string? Datos { get; set; } // JSON
    }
}
