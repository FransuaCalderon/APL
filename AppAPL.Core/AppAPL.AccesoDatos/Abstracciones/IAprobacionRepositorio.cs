using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.Dto.Aprobacion;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IAprobacionRepositorio
    {
        Task<IEnumerable<AprobacionDTO>> ObtenerAprobaciones(string entidad, int identidad, string idTipoProceso);
        Task<IEnumerable<AprobacionGeneralDTO>> ObtenerAprobacionesGenerales(string entidad, int identidad, string? idTipoProceso = null);
    }
}
