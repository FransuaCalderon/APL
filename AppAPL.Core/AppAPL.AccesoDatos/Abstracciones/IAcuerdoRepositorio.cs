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
       

        Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoGrupoDTO acuerdo);
        Task<IEnumerable<FondoAcuerdoDTO>> ConsultarFondoAcuerdo();
        Task<IEnumerable<BandejaAprobacionAcuerdoDTO>> ConsultarBandAprobAcuerdo(string usuarioAprobador);
        Task<BandejaAprobacionAcuerdoDTO?> ObtenerBandejaAprobacionPorId(int idAcuerdo);
    }
}
