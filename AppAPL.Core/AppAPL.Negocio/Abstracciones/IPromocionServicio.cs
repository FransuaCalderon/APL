using AppAPL.Dto.Promocion;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IPromocionServicio
    {
        Task<IEnumerable<AlmacenDTO>> ConsultarAlmacen();
        Task<IEnumerable<ArticuloEquivalenteDTO>> ConsultarArticuloEquivalente();
        Task<IEnumerable<ArticuloPrecioCompetenciaDTO>> ConsultarArticuloPrecioCompetencia();
        Task<IEnumerable<CanalDTO>> ConsultarCanal();
        Task<IEnumerable<GrupoAlmacenDTO>> ConsultarGrupoAlmacen();
        Task<IEnumerable<OtrosCostosDTO>> ConsultarOtrosCostos();
        Task<IEnumerable<TipoClienteDTO>> ConsultarTipoCliente();
        Task<IEnumerable<PromocionDTO>> ConsultarPromocion();
        Task<IEnumerable<PromocionAcuerdoDTO>> ConsultarPromocionAcuerdo();
        Task<IEnumerable<PromocionArticuloDTO>> ConsultarPromocionArticulo();
        Task<IEnumerable<PromocionSegmentoDTO>> ConsultarPromocionSegmento();
        Task<IEnumerable<PromocionSegmentoDetalleDTO>> ConsultarPromocionSegmentoDetalle();
    }
}
