using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Opciones
{
    public class OpcionJoinDTO
    {
        public int IdOpcion { get; set; }
        public string Opcion_Nombre { get; set; } = string.Empty;
        public string? Opcion_Descripcion { get; set; }
        public string? Vista { get; set; }
        public int IdEstado { get; set; }
        public int IdCatalogo { get; set; }
        public string Catalogo_Nombre { get; set; } = string.Empty;
        public string? Adicional { get; set; }
        public string? Abreviatura { get; set; }
        public int IdCatalogoTipo { get; set; }
        public string Catalogotipo_Nombre { get; set; } = string.Empty;
    }
}
