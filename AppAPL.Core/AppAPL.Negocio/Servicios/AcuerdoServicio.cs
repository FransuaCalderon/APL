using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;

namespace AppAPL.Negocio.Servicios
{
    public class AcuerdoServicio (IAcuerdoRepositorio repo) : IAcuerdoServicio
    {
        

        public Task<IEnumerable<ConsultarAcuerdoFondoDTO>> ConsultarAcuerdoFondo(int idFondo)
            => repo.ConsultarAcuerdoFondo(idFondo);

        public Task<AcuerdoDTO?> ObtenerPorIdAsync(int idAcuerdo)
            => repo.ObtenerPorIdAsync(idAcuerdo);

        public  Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoDTO acuerdo)
            => repo.CrearAsync(acuerdo);


        public Task<ControlErroresDTO> InactivarAcuerdo(InactivarAcuerdoDTO acuerdo)
            => repo.InactivarAcuerdo(acuerdo);

        public Task<ControlErroresDTO> ActualizarAsync(CrearActualizarAcuerdoDTO acuerdo, int idAcuerdo)
            => repo.ActualizarAsync(acuerdo, idAcuerdo);

        public Task<ControlErroresDTO> AprobarAcuerdo(AprobarAcuerdoDTO acuerdo)
            => repo.AprobarAcuerdo(acuerdo);
    }
}
