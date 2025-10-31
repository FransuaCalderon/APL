using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.Dto.Proveedor;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IProveedorServicio
    {
        Task<IEnumerable<ProveedorDTO>> ListarAsync();
    }
}
