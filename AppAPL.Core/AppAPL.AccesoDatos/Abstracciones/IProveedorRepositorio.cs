using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.Dto.Proveedor;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IProveedorRepositorio
    {
        Task<IEnumerable<ProveedorDTO>> ListarAsync();
    }
}
