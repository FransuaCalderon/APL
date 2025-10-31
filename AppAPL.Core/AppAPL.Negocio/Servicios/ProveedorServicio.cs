using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Proveedor;
using AppAPL.Negocio.Abstracciones;

namespace AppAPL.Negocio.Servicios
{
    public class ProveedorServicio (IProveedorRepositorio repo) : IProveedorServicio
    {
        public Task<IEnumerable<ProveedorDTO>> ListarAsync()
            => repo.ListarAsync();
    }
}
