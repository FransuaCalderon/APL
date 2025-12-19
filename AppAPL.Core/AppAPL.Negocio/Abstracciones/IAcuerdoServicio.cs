using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Fondos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IAcuerdoServicio
    {
        Task<IEnumerable<ConsultarAcuerdoFondoDTO>> ConsultarAcuerdoFondo(int idFondo);
        Task<IEnumerable<FondoAcuerdoDTO>> ConsultarFondoAcuerdo();

        Task<FiltrosItemsDTO> CargarCombosFiltrosItems();
        Task<IEnumerable<ArticuloDTO>> ConsultarArticulos(ConsultarArticuloDTO dto);
        

        Task<ControlErroresDTO> CrearAsync(CrearAcuerdoGrupoDTO acuerdo);
        Task<IEnumerable<BandejaAprobacionAcuerdoDTO>> ConsultarBandAprobAcuerdo(string usuarioAprobador);
        Task<BandAproAcuerdoPorIDDTO?> ObtenerBandejaAprobacionPorId(int idAcuerdo, int idAprobacion);
        Task<ControlErroresDTO> AprobarAcuerdo(AprobarAcuerdoRequest acuerdo);
        Task<IEnumerable<BandejaModificacionAcuerdoDTO>> ConsultarBandModAcuerdo();
        Task<BandModAcuerdoPorIDDTO?> ObtenerBandejaModificacionPorId(int idAcuerdo);
        Task<IEnumerable<BandejaInactivacionAcuerdoDTO>> ConsultarBandInacAcuerdo();
        Task<IEnumerable<BandejaConsultaAcuerdoDTO>> ConsultarBandConsAcuerdo();
        Task<BandConsAcuerdoPorIDDTO?> ObtenerBandejaConsultaPorId(int idAcuerdo);
        Task<ControlErroresDTO> InactivarAcuerdo(InactivarAcuerdoRequest acuerdo);
        Task<ControlErroresDTO> ActualizarAsync(ActualizarAcuerdoDTO actualizarAcuerdoDTO);
        Task<BandInacAcuerdoPorIDDTO?> ObtenerBandejaInactivacionPorId(int idAcuerdo);
        Task<IEnumerable<AcuerdoPromocionDTO>> ConsultarAcuerdoPromocion(int idAcuerdo);
    }
}
