using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IAcuerdoRepositorio
    {
        Task<IEnumerable<ConsultarAcuerdoFondoDTO>> ConsultarAcuerdoFondo(int idFondo);

        Task<FiltrosItemsDTO> CargarCombosFiltrosItems();
        Task<IEnumerable<ArticuloDTO>> ConsultarArticulos(ConsultarArticuloDTO dto);
       

        Task<ControlErroresDTO> CrearAsync(CrearAcuerdoGrupoDTO acuerdo);
        Task<IEnumerable<FondoAcuerdoDTO>> ConsultarFondoAcuerdo();
        Task<IEnumerable<BandejaAprobacionAcuerdoDTO>> ConsultarBandAprobAcuerdo(string usuarioAprobador);
        Task<BandAproAcuerdoPorIDDTO?> ObtenerBandejaAprobacionPorId(int idAcuerdo, int idAprobacion);
        Task<ControlErroresDTO> AprobarAcuerdo(AprobarAcuerdoRequest acuerdo);
        //Task<IEnumerable<AcuerdoDTO>> ObtenerAcuerdosAsync();
        //Task<AcuerdoDTO?> ObtenerPorIdAsync(int idAcuerdo);
        //Task<IEnumerable<AcuerdoFondoDTO>> ObtenerAcuerdosFondosAsync();
        //Task<AcuerdoFondoDTO?> ObtenerAcuerdoFondoPorIdAsync(int idAcuerdo);
        Task<IEnumerable<BandejaModificacionAcuerdoDTO>> ConsultarBandModAcuerdo();
        Task<BandModAcuerdoPorIDDTO?> ObtenerBandejaModificacionPorId(int idAcuerdo);
        Task<IEnumerable<BandejaInactivacionAcuerdoDTO>> ConsultarBandInacAcuerdo();
        Task<IEnumerable<BandejaConsultaAcuerdoDTO>> ConsultarBandConsAcuerdo();
        Task<BandConsAcuerdoPorIDDTO?> ObtenerBandejaConsultaPorId(int idAcuerdo);
        Task<InactivarAcuerdoResponse> InactivarAcuerdo(InactivarAcuerdoRequest acuerdo);
        Task<ControlErroresDTO> ActualizarAsync(ActualizarAcuerdoDTO actualizarAcuerdoDTO);
    }
}
