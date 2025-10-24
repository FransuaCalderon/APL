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
        public async Task<int> CrearAsync(CrearActualizarLogRequest log)
        {
            logger.LogInformation("AQUI SE SUPONE QUE DEBERIA DE IR EL REPOSITORIO PARA GRABAR EN LA TABLA DE LOG");
            return 1;
        }

        public Task<IEnumerable<LogDTO>> ListarAsync(string? nombre = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50)
        {
            throw new NotImplementedException();
        }

        public Task<LogDTO?> ObtenerPorIdAsync(int idLog)
        {
            throw new NotImplementedException();
        }
    }
}
