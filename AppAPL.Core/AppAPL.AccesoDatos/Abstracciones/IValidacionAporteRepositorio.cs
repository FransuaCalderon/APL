using AppAPL.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IValidacionAporteRepositorio
    {
        Task<IEnumerable<AportesPorArticuloDTO>> ConsultarAportesPorArticulo(string codigoArticulo);
        Task<IEnumerable<AportesPorMarcaDTO>> ConsultarAportesPorMarca(string codigoMarca);
        Task<IEnumerable<AportesPorMarcaProveedorDTO>> ConsultarAportesPorMarcaProveedor(string codigoMarca, string identificacion);
    }
}
