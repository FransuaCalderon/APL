using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.Dto.Acuerdo;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IAcuerdoServicio
    {
        Task<IEnumerable<ConsultarAcuerdoFondoDTO>> ConsultarAcuerdoFondo(int idFondo);
    }
}
