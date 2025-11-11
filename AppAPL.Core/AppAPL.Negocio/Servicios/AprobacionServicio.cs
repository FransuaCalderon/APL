using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Aprobacion;
using AppAPL.Negocio.Abstracciones;

namespace AppAPL.Negocio.Servicios
{
    public class AprobacionServicio (IAprobacionRepositorio repo) : IAprobacionServicio
    {
        public Task<IEnumerable<AprobacionDTO>> ObtenerAprobacionesAsync(string entidad, int identidad, string? idTipoProceso = null)
            => repo.ObtenerAprobacionesAsync(entidad, identidad, idTipoProceso);
    }
}
