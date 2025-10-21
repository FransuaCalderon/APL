using AppAPL.Dto.ParametrosTipo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IParametroTipoServicio
    {
        Task ActualizarAsync(CrearActualizarParametroTipoRequest parametroTipo, int idParametroTipo);
        Task<int> CrearAsync(CrearActualizarParametroTipoRequest parametroTipo);
        Task EliminarAsync(int idParametroTipo);
        Task<IEnumerable<ParametroTipoDTO>> ListarAsync(
           string? nombre = null,
           int? idEstado = null,
           DateTime? creadoDesde = null,
           DateTime? creadoHasta = null,
           int pageNumber = 1,
           int pageSize = 50);
        Task<ParametroTipoDTO?> ObtenerPorIdAsync(int idParametroTipo);
    }
}
