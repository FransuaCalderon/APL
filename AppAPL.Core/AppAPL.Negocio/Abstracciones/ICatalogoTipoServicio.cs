using apiOracle.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface ICatalogoTipoServicio
    {
        Task<int> ActualizarAsync(CatalogoTipoDTO catalogoTipoDTO);
        Task<int> CrearAsync(CatalogoTipoDTO catalogoTipoDTO);
        Task<int> EliminarAsync(int id);
        Task<IEnumerable<CatalogoTipoDTO>> ListarAsync();
        Task<CatalogoTipoDTO?> ObtenerByIdAsync(int id);
    }
}
