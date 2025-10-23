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
        public Task ActualizarAsync(CrearActualizarFondoRequest fondo, int idFondo)
        {
            throw new NotImplementedException();
        }

        public Task<int> CrearAsync(CrearActualizarFondoRequest fondo)
        {
            throw new NotImplementedException();
        }

        public Task EliminarAsync(int idFondo)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<FondoDTO>> ListarAsync(string? nombre = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50)
        {
            throw new NotImplementedException();
        }

        public Task<FondoDTO?> ObtenerPorIdAsync(int idFondo)
        {
            throw new NotImplementedException();
        }
    }
}
