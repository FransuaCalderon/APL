
using AppAPL.Dto.Log;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface ILogServicio
    {
        Task<IEnumerable<LogDTO>> ConsultarLogGeneral(int entidad, int identidad);
    }
}
