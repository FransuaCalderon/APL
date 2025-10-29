using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Log;
using AppAPL.Negocio.Abstracciones;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Servicios
{
    public class LogServicio(ILogRepositorio repo, ILogger<LogServicio> logger) : ILogServicio  // borrar logger, solo es para probar
    {
        public Task<IEnumerable<LogDTO>> ObtenerLogsPorOpcionAsync(int idOpcion, DateTime? fechaInicio = null, DateTime? fechaFin = null)
            => repo.ObtenerLogsPorOpcionAsync(idOpcion, fechaInicio, fechaFin);

        public Task<IEnumerable<LogDTO>> ObtenerLogsPorUsuarioAsync(int idUser, DateTime? fechaInicio = null, DateTime? fechaFin = null)
            => repo.ObtenerLogsPorUsuarioAsync(idUser);

        public Task RegistrarLogNombreAsync(CrearActualizarLogRequest log)
            => repo.RegistrarLogNombreAsync(log);

        public Task RegistrarLogOpcionAsync(CrearActualizarLogRequest log)
            => repo.RegistrarLogOpcionAsync(log);
    }
}
