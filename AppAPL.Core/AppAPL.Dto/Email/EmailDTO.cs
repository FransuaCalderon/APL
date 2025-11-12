using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Email
{
    public class EmailDTO
    {
    }

    public class DatosCorreoDTO
    {
        public string tipo_registro { get; set; }
        public int id_registro { get; set; }
        public string nombrearchivo { get; set; }
        public string para { get; set; }

        public string cc { get; set; }
        public string cargo { get; set; }
        public string idproveedor { get; set; }
        public string etiqueta_entidad { get; set; }
        public string etiqueta_tipo_proceso { get; set; }
    }

    public class ConsultarDatosCorreoRequest
    {
        public string Entidad { get; set; }
        public string TipoProceso { get; set; }
        public string IdDocumento { get; set; }
    }
    
}
