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

        Task<ControlErroresDTO> ActualizarAsync(CrearActualizarAcuerdoDTO acuerdo, int idAcuerdo);
        Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoDTO acuerdo);
        Task<AcuerdoDTO?> ObtenerPorIdAsync(int idAcuerdo);
        Task<ControlErroresDTO> AprobarAcuerdo(AprobarAcuerdoDTO acuerdo);
        Task<ControlErroresDTO> InactivarAcuerdo(InactivarAcuerdoDTO acuerdo);
    }
}
