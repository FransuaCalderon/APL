using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.Dto.Acuerdo;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IAcuerdoRepositorio
    {
        Task<IEnumerable<ConsultarAcuerdoFondoDTO>> ConsultarAcuerdoFondo(int idFondo);
    }
}
