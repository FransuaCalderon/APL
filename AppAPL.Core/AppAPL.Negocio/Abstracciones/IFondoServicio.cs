
using AppAPL.Dto.Fondos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IFondoServicio
    {
        Task ActualizarAsync(ActualizarFondoRequest fondo, int idFondo);
        Task CrearAsync(CrearFondoRequest fondo);
        Task EliminarAsync(int idFondo);
        Task<IEnumerable<FondoDTO>> ListarAsync();
    }
}
