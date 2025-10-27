
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
        Task<IEnumerable<LogDTO>> ObtenerLogsPorOpcionAsync(int idOpcion, DateTime? fechaInicio = null, DateTime? fechaFin = null);
        Task<IEnumerable<LogDTO>> ObtenerLogsPorUsuarioAsync(int idUser, DateTime? fechaInicio = null, DateTime? fechaFin = null);
        Task RegistrarLogNombreAsync(CrearActualizarLogRequest log);
        Task RegistrarLogOpcionAsync(CrearActualizarLogRequest log);
    }
}
