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
        public Task<IEnumerable<AprobacionGeneralDTO>> ObtenerAprobacionesGenerales(int entidad, int identidad)
            => repo.ObtenerAprobacionesGenerales(entidad, identidad);

        public Task<IEnumerable<AprobacionDTO>> ObtenerAprobaciones(string entidad, int identidad, string idTipoProceso)
            => repo.ObtenerAprobaciones(entidad,identidad, idTipoProceso);

        public Task<IEnumerable<AprobacionPorIdDTO>> ObtenerAprobacionesPorId(int entidad, int identidad)
            => repo.ObtenerAprobacionesPorId(entidad,identidad);
    }
}
