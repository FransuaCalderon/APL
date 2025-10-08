using apiOracle.DTOs;
using AppAPL.AccesoDatos.Abstracciones;
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
        public async Task<int> CrearAsync(CatalogoTipoDTO catalogoTipoDTO)
            => await repo.InsertarCatalogoTipoAsync(catalogoTipoDTO);

        public async Task<int> ActualizarAsync(CatalogoTipoDTO catalogoTipoDTO)
            => await repo.ActualizarCatalogoTipoAsync(catalogoTipoDTO);

        public async Task<int> EliminarAsync(int id)
            => await repo.EliminarCatalogoTipoAsync(id);

        public async Task<CatalogoTipoDTO?> ObtenerByIdAsync(int id)
            => await repo.ObtenerCatalogoTipoPorIdAsync(id);

        public async Task<IEnumerable<CatalogoTipoDTO>> ListarAsync()
            => await repo.ObtenerCatalogosTipoAsync();
    }
}
