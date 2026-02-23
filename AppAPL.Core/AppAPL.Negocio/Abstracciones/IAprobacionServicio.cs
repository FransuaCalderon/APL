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
        Task<IEnumerable<AprobacionGeneralDTO>> ObtenerAprobacionesGenerales(int entidad, int identidad);
        Task<IEnumerable<AprobacionDTO>> ObtenerAprobaciones(string entidad, int identidad, string idTipoProceso);
        Task<IEnumerable<AprobacionPorIdDTO>> ObtenerAprobacionesPorId(int entidad, int identidad);
    }
}
