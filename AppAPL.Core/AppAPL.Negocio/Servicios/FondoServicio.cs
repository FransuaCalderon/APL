using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Servicios
{
    public class FondoServicio(IFondoRepositorio repo) : IFondoServicio
    {
        public async Task<IEnumerable<FondoDTO>> ListarAsync()
            => await repo.ObtenerFondosAsync();

        public Task<FondoDTO?> ObtenerPorIdAsync(int idFondo)
        {
            throw new NotImplementedException();
        }

        public async Task<int> CrearAsync(CrearActualizarFondoRequest fondo)
            => await repo.CrearAsync(fondo);

        public async Task ActualizarAsync(CrearActualizarFondoRequest fondo, int idFondo)
            => await repo.ActualizarAsync(fondo, idFondo);

        public async Task EliminarAsync(int idFondo)
            => await repo.EliminarAsync(idFondo);

    }
}
