using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto;
using AppAPL.Negocio.Abstracciones;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Servicios
{
    public class ValidacionAporteServicio (IValidacionAporteRepositorio repo) : IValidacionAporteServicio
    {
        public Task<IEnumerable<AportesPorMarcaDTO>> ConsultarAportesPorMarca(string codigoMarca)
            => repo.ConsultarAportesPorMarca (codigoMarca);

        public Task<IEnumerable<AportesPorArticuloDTO>> ConsultarAportesPorArticulo(string codigoArticulo)
            => repo.ConsultarAportesPorArticulo (codigoArticulo);

        public Task<IEnumerable<AportesPorMarcaProveedorDTO>> ConsultarAportesPorMarcaProveedor(string codigoMarca, string identificacion)
            => repo.ConsultarAportesPorMarcaProveedor(codigoMarca, identificacion);
    }
}
