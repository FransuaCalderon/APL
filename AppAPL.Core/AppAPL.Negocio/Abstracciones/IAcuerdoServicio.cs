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
    }
}
