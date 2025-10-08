
using AppAPL.Dto.CatalogoTipo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface ICatalogoTipoServicio
    {
        Task ActualizarAsync(CrearActualizarCatalogoTipoRequest catalogo, int idCatalogoTipo);
        Task<int> CrearAsync(CrearActualizarCatalogoTipoRequest catalogo);
        Task EliminarAsync(int idCatalogoTipo);
        Task<IEnumerable<CatalogoTipoDTO>> ListarAsync(string? nombre = null,
           int? idEstado = null,
           DateTime? creadoDesde = null,
           DateTime? creadoHasta = null,
           int pageNumber = 1,
           int pageSize = 50);
        Task<CatalogoTipoDTO?> ObtenerPorIdAsync(int idCatalogoTipo);
    }
}
