
using AppAPL.Dto.ParametrosTipo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IParametroTipoRepositorio
    {
        Task ActualizarAsync(CrearActualizarParametroTipoRequest parametroTipo, int idParametroTipo);
        Task<int> CrearAsync(CrearActualizarParametroTipoRequest parametroTipo);
        Task EliminarAsync(int idParametroTipo);
        Task<IEnumerable<ParametroTipoDTO>> ObtenerCatalogosTipoAsync(
           string? nombre = null,
           int? idEstado = null,
           DateTime? creadoDesde = null,
           DateTime? creadoHasta = null,
           int pageNumber = 1,
           int pageSize = 50);
        Task<ParametroTipoDTO?> ObtenerPorIdAsync(int idParametroTipo);
    }
}
