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
        public Task<IEnumerable<LogDTO>> ConsultarLogGeneral(string entidad, int identidad)
            => repo.ConsultarLogGeneral(entidad, identidad);
    }
}
