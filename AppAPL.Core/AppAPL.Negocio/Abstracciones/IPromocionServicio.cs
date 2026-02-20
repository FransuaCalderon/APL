using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
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
        Task<ControlErroresDTO> CrearAsync(CrearPromocionRequestDTO promocion);
        Task<GruposPromocionesDTO> CargarCombosPromociones();
        Task<IEnumerable<BandInacPromocionDTO>> ConsultarBandInacPromocion();
        Task<IEnumerable<BandAproPromocionDTO>> ConsultarBandAprobPromocion(string usuarioAprobador);
        Task<IEnumerable<AcuerdoPromoDTO>> ConsultarAcuerdo(string tipoFondo, string claseAcuerdo);
        Task<BandAproPromocionIDDTO?> ObtenerBandAproPromoPorId(int idPromocion, int idAprobacion);
        Task<ControlErroresDTO> AprobarPromocion(AprobarPromocionRequest promocion);
        Task<IEnumerable<PromocionDTO>> ConsultarBandGeneral();
        Task<IEnumerable<BandModPromocionDTO>> ConsultarBandModPromocion();
        Task<BandModPromocionIDDTO?> ObtenerBandModPromoPorId(int idPromocion);
        Task<BandInacPromocionIDDTO?> ObtenerBandInacPromoPorId(int idPromocion);
        Task<ControlErroresDTO> InactivarPromocion(InactivarPromocionRequest promocion);
    }
}
