

using AppAPL.Dto;
using AppAPL.Dto.Fondos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IFondoRepositorio
    {
        Task<ControlErroresDTO> ActualizarAsync(ActualizarFondoRequest fondo, int idFondo);
        Task CrearAsync(CrearFondoRequest fondo);
        Task EliminarAsync(int idFondo);
        Task<IEnumerable<FondoDTO>> ObtenerFondosAsync();
        Task<FondoDTO?> ObtenerPorIdAsync(int idFondo);
    }
}
