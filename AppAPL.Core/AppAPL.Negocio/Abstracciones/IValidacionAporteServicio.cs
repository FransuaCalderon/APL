using AppAPL.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IValidacionAporteServicio
    {
        Task<IEnumerable<AportesPorMarcaDTO>> ConsultarAportesPorMarca(string codigoMarca);
        Task<IEnumerable<AportesPorArticuloDTO>> ConsultarAportesPorArticulo(string codigoArticulo);
        Task<IEnumerable<AportesPorMarcaProveedorDTO>> ConsultarAportesPorMarcaProveedor(string codigoMarca, string identificacion);
    }
}
