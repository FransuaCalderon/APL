
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
        Task<IEnumerable<LogDTO>> ListarAsync(string? nombre = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50);
        Task<LogDTO?> ObtenerPorIdAsync(int idLog);
        Task<int> CrearAsync(CrearActualizarLogRequest log);
    }
}
