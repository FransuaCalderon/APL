using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Aprobacion
{
    public class AprobacionGeneralDTO
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


    public class AprobacionDTO
    {
        public int IdAprobacion { get; set; }
        public int IdEntidad { get; set; }
        public int entidad_id { get; set; }
        public string entidad_nombre { get; set; }
        public string entidad_etiqueta { get; set; }
        public int tipoproceso_id { get; set; }
        public string tipoproceso_nombre { get; set; }
        public string tipoproceso_etiqueta { get; set; }
        public string idusersolicitud { get; set; }
        public string nombreusersolicitud { get; set; }
        public DateTime fechasolicitud { get; set; }
        public string iduseraprobador { get; set; }
        public string comentario { get; set; }
        public int nivelaprobacion { get; set; }
        public int estado_id { get; set; }
        public string estado_nombre { get; set; }
        public string estado_etiqueta { get; set; }


    }
}
