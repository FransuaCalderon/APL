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

        Task<ControlErroresDTO> ActualizarAsync(CrearActualizarAcuerdoDTO acuerdo, int idAcuerdo);
        Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoDTO acuerdo);
        Task<AcuerdoDTO?> ObtenerPorIdAsync(int idAcuerdo);
        Task<ControlErroresDTO> AprobarAcuerdo(AprobarAcuerdoDTO acuerdo);
        Task<ControlErroresDTO> InactivarAcuerdo(InactivarAcuerdoDTO acuerdo);
    }
}
