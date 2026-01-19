using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Promocion;
using AppAPL.Negocio.Abstracciones;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Servicios
{
    public class PromocionServicio (IPromocionRepositorio repo) : IPromocionServicio
    {
        public Task<IEnumerable<AlmacenDTO>> ConsultarAlmacen()
            => repo.ConsultarAlmacen();

        public Task<IEnumerable<ArticuloEquivalenteDTO>> ConsultarArticuloEquivalente()
            => repo.ConsultarArticuloEquivalente();

        public Task<IEnumerable<ArticuloPrecioCompetenciaDTO>> ConsultarArticuloPrecioCompetencia()
            => repo.ConsultarArticuloPrecioCompetencia();

        public Task<IEnumerable<CanalDTO>> ConsultarCanal()
            => repo.ConsultarCanal();

        public Task<IEnumerable<GrupoAlmacenDTO>> ConsultarGrupoAlmacen()
            => repo.ConsultarGrupoAlmacen();

        public Task<IEnumerable<OtrosCostosDTO>> ConsultarOtrosCostos()
            => repo.ConsultarOtrosCostos();

        public Task<IEnumerable<TipoClienteDTO>> ConsultarTipoCliente()
            => repo.ConsultarTipoCliente();
    }
}
