using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Promocion;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IPromocionRepositorio
    {
        Task<ControlErroresDTO> ActualizarAsync(ActualizarPromocionRequest promocion);
        Task<ControlErroresDTO> AprobarPromocion(AprobarPromocionRequest promocion);
        Task<GruposPromocionesDTO> CargarCombosPromociones();
        Task<IEnumerable<AcuerdoPromoDTO>> ConsultarAcuerdo(string tipoFondo, string claseAcuerdo);
        Task<IEnumerable<AlmacenDTO>> ConsultarAlmacen();
        Task<IEnumerable<ArticuloEquivalenteDTO>> ConsultarArticuloEquivalente();
        Task<IEnumerable<ArticuloPrecioCompetenciaDTO>> ConsultarArticuloPrecioCompetencia();
        Task<IEnumerable<BandAproPromocionDTO>> ConsultarBandAprobPromocion(string usuarioAprobador);
        Task<IEnumerable<PromocionDTO>> ConsultarBandGeneral();
        Task<IEnumerable<BandInacPromocionDTO>> ConsultarBandInacPromocion();
        Task<IEnumerable<BandModPromocionDTO>> ConsultarBandModPromocion();
        Task<IEnumerable<CanalDTO>> ConsultarCanal();
        Task<IEnumerable<GrupoAlmacenDTO>> ConsultarGrupoAlmacen();
        Task<IEnumerable<OtrosCostosDTO>> ConsultarOtrosCostos();
        Task<IEnumerable<PromocionDTO>> ConsultarPromocion();
        Task<IEnumerable<PromocionAcuerdoDTO>> ConsultarPromocionAcuerdo();
        Task<IEnumerable<PromocionArticuloDTO>> ConsultarPromocionArticulo();
        Task<IEnumerable<PromocionSegmentoDTO>> ConsultarPromocionSegmento();
        Task<IEnumerable<PromocionSegmentoDetalleDTO>> ConsultarPromocionSegmentoDetalle();
        Task<IEnumerable<TipoClienteDTO>> ConsultarTipoCliente();
        Task<ControlErroresDTO> CrearAsync(CrearPromocionRequestDTO promocion);
        Task<ControlErroresDTO> InactivarPromocion(InactivarPromocionRequest promocion);
        Task<BandAproPromocionIDDTO?> ObtenerBandAproPromoPorId(int idPromocion, int idAprobacion);
        Task<BandInacPromocionIDDTO?> ObtenerBandInacPromoPorId(int idPromocion);
        Task<BandModPromocionIDDTO?> ObtenerBandModPromoPorId(int idPromocion);
    }
}
