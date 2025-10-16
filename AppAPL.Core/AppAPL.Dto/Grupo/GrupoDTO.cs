using AppAPL.Dto.Catalogo;
using AppAPL.Dto.Opciones;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Grupo
{
    public class GrupoDTO
    {
        public CatalogoDTO Catalogo { get; set; }
        public IEnumerable<OpcionDTO> Opciones { get; set; }
    }
}
