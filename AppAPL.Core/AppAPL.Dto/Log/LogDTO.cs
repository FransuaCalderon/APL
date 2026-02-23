using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Log
{
    public class LogDTO
    {
        public long IdLog { get; set; }               
        public DateTime? Fecha { get; set; }
        public string Usuario { get; set; }
        public string Opción { get; set; }
        public string Acción { get; set; }
        public string Entidad { get; set; }
        public string Tipo_Proceso { get; set; }
        public string Datos { get; set; }
    }
}
