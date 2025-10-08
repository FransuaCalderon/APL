
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.CatalogoTipo;
using AppAPL.Negocio.Abstracciones;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Servicios
{
    public sealed class CatalogoTipoServicio (ICatalogoTipoRepositorio repo) : ICatalogoTipoServicio
    {
        public async Task<int> CrearAsync(CrearActualizarCatalogoTipoRequest catalogoTipoDTO)
            => await repo.CrearAsync(catalogoTipoDTO);

        public async Task ActualizarAsync(CrearActualizarCatalogoTipoRequest catalogoTipoDTO, int idCatalogoTipo)
            => await repo.ActualizarAsync(catalogoTipoDTO, idCatalogoTipo);

        public async Task EliminarAsync(int id)
            => await repo.EliminarAsync(id);

        public async Task<CatalogoTipoDTO?> ObtenerPorIdAsync(int idCatalogoTipo)
            => await repo.ObtenerPorIdAsync(idCatalogoTipo);

        public async Task<IEnumerable<CatalogoTipoDTO>> ListarAsync(string? nombre = null,
           int? idEstado = null,
           DateTime? creadoDesde = null,
           DateTime? creadoHasta = null,
           int pageNumber = 1,
           int pageSize = 50)
            => await repo.ObtenerCatalogosTipoAsync(nombre, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);
    }
}
