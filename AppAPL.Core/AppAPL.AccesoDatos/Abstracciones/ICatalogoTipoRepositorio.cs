
using AppAPL.Dto.Catalogo;
using AppAPL.Dto.CatalogoTipo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface ICatalogoTipoRepositorio
    {
        Task ActualizarAsync(CrearActualizarCatalogoTipoRequest catalogoTipo, int idCatalogoTipo);
        Task<int> CrearAsync(CrearActualizarCatalogoTipoRequest catalogoTipo);
        Task EliminarAsync(int idCatalogoTipo);
        Task<IEnumerable<CatalogoTipoDTO>> ObtenerCatalogosTipoAsync(
           string? nombre = null,
           int? idEstado = null,
           DateTime? creadoDesde = null,
           DateTime? creadoHasta = null,
           int pageNumber = 1,
           int pageSize = 50);
        Task<CatalogoTipoDTO?> ObtenerPorIdAsync(int idCatalogoTipo);
    }
}
