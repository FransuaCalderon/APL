using apiOracle.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface ICatalogoTipoRepositorio
    {
        Task<int> ActualizarCatalogoTipoAsync(CatalogoTipoDTO dto);
        Task<int> EliminarCatalogoTipoAsync(int id);
        Task<int> InsertarCatalogoTipoAsync(CatalogoTipoDTO catalogoTipoDTO);
        Task<IEnumerable<CatalogoTipoDTO>> ObtenerCatalogosTipoAsync();
        Task<CatalogoTipoDTO?> ObtenerCatalogoTipoPorIdAsync(int id);
    }
}
