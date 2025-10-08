using AppAPL.Dto.Catalogo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface ICatalogoRepositorio
    {
        Task ActualizarAsync(CrearActualizarCatalogoRequest catalogo, int IdCatalogo);
        Task<int> CrearAsync(CrearActualizarCatalogoRequest catalogo);
        Task EliminarAsync(int idCatalogo);
        Task<IEnumerable<CatalogoDTO>> ListarAsync(string? nombre = null, int? idCatalogoTipo = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50);
        Task<CatalogoDTO?> ObtenerPorIdAsync(int idCatalogo);
    }
}
