using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Parametros
{
    public class ParametroDTO
    {
        public int IdParametro { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Adicional { get; set; }
        public string? Abreviatura { get; set; }
        public int IdCatalogoTipo { get; set; }
        public int IdUsuarioCreacion { get; set; }
        public DateTime FechaCreacion { get; set; }
        public int? IdUsuarioModificacion { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public int IdEstado { get; set; }
        public string? IdEtiqueta { get; set; }
    }

    public class CrearActualizarParametroRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Adicional { get; set; }
        public string? Abreviatura { get; set; }
        public int IdParametroTipo { get; set; }
        public int IdUsuarioCreacion { get; set; }
        public DateTime FechaCreacion { get; set; }
        public int? IdUsuarioModificacion { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public int IdEstado { get; set; }
        public string? IdEtiqueta { get; set; }
    }
}
