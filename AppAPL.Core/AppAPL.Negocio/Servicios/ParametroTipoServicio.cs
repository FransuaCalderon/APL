using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.CatalogoTipo;
using AppAPL.Dto.ParametrosTipo;
using AppAPL.Negocio.Abstracciones;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Servicios
{
    public sealed class ParametroTipoServicio(IParametroTipoRepositorio repo) : IParametroTipoServicio
    {
        public async Task ActualizarAsync(CrearActualizarParametroTipoRequest parametroTipo, int idParametroTipo)
            => await repo.ActualizarAsync(parametroTipo, idParametroTipo);

        public async Task<int> CrearAsync(CrearActualizarParametroTipoRequest parametroTipo)
            => await repo.CrearAsync(parametroTipo);

        public async Task EliminarAsync(int idParametroTipo)
            => await repo.EliminarAsync(idParametroTipo);

        public async Task<IEnumerable<ParametroTipoDTO>> ListarAsync(string? nombre = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50)
            => await repo.ObtenerCatalogosTipoAsync(nombre, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);

        public async Task<ParametroTipoDTO?> ObtenerPorIdAsync(int idParametroTipo)
            => await repo.ObtenerPorIdAsync(idParametroTipo);
    }
}
