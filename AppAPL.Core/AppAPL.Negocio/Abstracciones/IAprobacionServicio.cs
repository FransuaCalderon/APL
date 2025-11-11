using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.Dto.Aprobacion;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IAprobacionServicio
    {
        Task<IEnumerable<AprobacionDTO>> ObtenerAprobacionesAsync(string entidad, int identidad, string? idTipoProceso = null);
    }
}
