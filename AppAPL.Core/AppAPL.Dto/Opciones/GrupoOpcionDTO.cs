using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Dto.Opciones
{
    public class GrupoOpcionDTO
    {
        public IEnumerable<int> Grupos { get; set; }
        public IEnumerable<OpcionJoinDTO> Opciones { get; set; }
    }
}
