using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Parametros;
using AppAPL.Negocio.Abstracciones;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Servicios
{
    public sealed class ParametroServicio  (IParametroRepositorio repo) : IParametroServicio
    {
        public Task ActualizarAsync(CrearActualizarParametroRequest parametro, int idParametro)
            => repo.ActualizarAsync(parametro, idParametro);

        public Task<int> CrearAsync(CrearActualizarParametroRequest parametro)
            => repo.CrearAsync(parametro);

        public Task EliminarAsync(int idParametro)
        => repo.EliminarAsync(idParametro);

        public Task<IEnumerable<ParametroDTO>> ListarAsync(string? nombre = null, int? idParametroTipo = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50)
            => repo.ListarAsync(nombre, idParametroTipo, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);

        public Task<ParametroDTO?> ObtenerPorIdAsync(int idParametro)
            => repo.ObtenerPorIdAsync(idParametro);
    }
}
