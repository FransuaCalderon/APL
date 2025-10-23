using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Fondos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class FondoRepositorio(OracleConnectionFactory factory) : IFondoRepositorio
    {
        public async Task ActualizarAsync(CrearActualizarFondoRequest fondo, int idFondo)
        {
            throw new NotImplementedException();
        }

        public async Task<int> CrearAsync(CrearActualizarFondoRequest fondo)
        {
            throw new NotImplementedException();
        }

        public async Task EliminarAsync(int idFondo)
        {
            throw new NotImplementedException();
        }

        public async Task<IEnumerable<FondoDTO>> ObtenerFondosAsync(string? nombre = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50)
        {
            throw new NotImplementedException();
        }

        public async Task<FondoDTO?> ObtenerPorIdAsync(int idFondo)
        {
            throw new NotImplementedException();
        }
    }
}
