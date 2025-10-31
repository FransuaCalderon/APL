using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Opciones
{
    public class OpcionDTO
    {
        public int? IdOpcion { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public int IdGrupo { get; set; }
        public string Vista { get; set; } = string.Empty;
        public int IdUsuarioCreacion { get; set; }
        public DateTime FechaCreacion { get; set; }
        public int? IdUsuarioModificacion { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public int IdEstado { get; set; }
        public int? IdTipoServicio { get; set; }
    }


    public class CrearActualizarOpcionRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public int IdGrupo { get; set; }
        public string Vista { get; set; } = string.Empty;
        public int IdUsuarioCreacion { get; set; }
        public DateTime FechaCreacion { get; set; }
        public int? IdUsuarioModificacion { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public int IdEstado { get; set; }
        public int? IdTipoServicio { get; set; }
    }

    public class ComboDTO
    {
        public int idcatalogotipo { get; set; }
        public string nombre_tipoCatalogo { get; set; }
        public string idetiqeuta_tipoCatalogo { get; set; }
        public int IdCatalogo { get; set; }
        public string nombre_Catalogo { get; set; }
        public string adicional_Catalogo { get; set; }
        public string abreviatura_Catalogo { get; set; }
        public string idetiqeuta_Catalogo { get; set; }
    }

}
