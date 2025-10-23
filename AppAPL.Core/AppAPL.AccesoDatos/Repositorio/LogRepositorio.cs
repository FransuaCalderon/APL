using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Log;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class LogRepositorio(OracleConnectionFactory factory) : ILogRepositorio
    {
        public Task<int> CrearAsync(CrearActualizarLogRequest log)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<LogDTO>> ObtenerLogsAsync(string? nombre = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50)
        {
            throw new NotImplementedException();
        }

        public Task<LogDTO?> ObtenerPorIdAsync(int idLog)
        {
            throw new NotImplementedException();
        }
    }
}
