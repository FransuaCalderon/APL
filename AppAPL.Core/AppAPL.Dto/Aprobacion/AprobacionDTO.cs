using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Aprobacion
{
    public class AprobacionGeneralDTO
    {
        public string tipo_solicitud { get; set; }
        public string usuario_solicita { get; set; }
        public DateTime fecha_solicitud { get; set; }
        public string usuario_aprobador { get; set; }
        public string comentario_aprobador { get; set; }
        public DateTime fecha_aprobacion { get; set; }
        public int nivel { get; set; }
        public string estado { get; set; }
        public int lote { get; set; }
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

    public class AprobacionPorIdDTO
    {
        public int tipoproceso { get; set; }
        public string nombre_tipo_proceso { get; set; }
        public string idusariosolicitud { get; set; }
        public string nombreusersolicitud { get; set; }
        public DateTime fechasolicitud { get; set; }
        public string iduseraprobador { get; set; }
        public DateTime fechaaprobacion { get; set; }
        public string comentario { get; set; }
        public int nivelaprobacion { get; set; }
        public int idestadoregistro { get; set; }
        public string nombre_estado_registro { get; set; }
    }
}
