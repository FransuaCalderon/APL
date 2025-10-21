
using AppAPL.Dto.Parametros;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IParametroServicio
    {
        Task ActualizarAsync(CrearActualizarParametroRequest parametro, int idParametro);
        Task<int> CrearAsync(CrearActualizarParametroRequest parametro);
        Task EliminarAsync(int idParametro);
        Task<IEnumerable<ParametroDTO>> ListarAsync(string? nombre = null, int? idParametroTipo = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50);
        Task<ParametroDTO?> ObtenerPorIdAsync(int idParametro);
    }
}
