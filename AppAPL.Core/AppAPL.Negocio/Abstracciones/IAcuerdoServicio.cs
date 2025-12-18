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
        

        Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoGrupoDTO acuerdo);
        Task<IEnumerable<BandejaAprobacionAcuerdoDTO>> ConsultarBandAprobAcuerdo(string usuarioAprobador);
        Task<BandAproAcuerdoPorIDDTO?> ObtenerBandejaAprobacionPorId(int idAcuerdo, int idAprobacion);
        Task<ControlErroresDTO> AprobarAcuerdo(AprobarAcuerdoRequest acuerdo);
        Task<IEnumerable<AcuerdoDTO>> ListarAsync();
        Task<AcuerdoDTO?> ObtenerPorIdAsync(int idAcuerdo);
        Task<IEnumerable<AcuerdoFondoDTO>> ObtenerAcuerdosFondosAsync();
        Task<AcuerdoFondoDTO?> ObtenerAcuerdoFondoPorIdAsync(int idAcuerdo);
        Task<IEnumerable<BandejaModificacionAcuerdoDTO>> ConsultarBandModAcuerdo();
        Task<BandModAcuerdoPorIDDTO?> ObtenerBandejaModificacionPorId(int idAcuerdo);
        Task<IEnumerable<BandejaInactivacionAcuerdoDTO>> ConsultarBandInacAcuerdo();
        Task<IEnumerable<BandejaConsultaAcuerdoDTO>> ConsultarBandConsAcuerdo();
        Task<BandConsAcuerdoPorIDDTO?> ObtenerBandejaConsultaPorId(int idAcuerdo);
        Task<InactivarAcuerdoResponse> InactivarAcuerdo(InactivarAcuerdoRequest acuerdo);
    }
}
