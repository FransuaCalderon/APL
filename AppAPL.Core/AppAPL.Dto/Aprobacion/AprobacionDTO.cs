using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Aprobacion
{
    public class AprobacionDTO
    {
        public int IdAprobacion { get; set; }
        public int Entidad { get; set; }
        public int IdEntidad { get; set; }
        public int IdTipoProceso { get; set; }
        public string IdUserSolicitud { get; set; }
        public string NombreUserSolicitud { get; set; }
        public DateTime FechaSolicitud { get; set; }
        public string IdUserAprobador { get; set; }
        public DateTime FechaAprobacion { get; set; }
        public string Comentario { get; set; }
        public int NivelAprobacion { get; set; }
        public int IdEstadoRegistro { get; set; }
    }
}
