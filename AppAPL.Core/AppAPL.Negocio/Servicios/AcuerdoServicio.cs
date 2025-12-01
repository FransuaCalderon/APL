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

        public Task<IEnumerable<FondoAcuerdoDTO>> ConsultarFondoAcuerdo()
            => repo.ConsultarFondoAcuerdo();

        public Task<IEnumerable<ArticuloDTO>> ConsultarArticulos(int idMarca, int idDivision, int idDepartamento, int idClase)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<ClaseDTO>> ConsultarClases()
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<DepartamentoDTO>> ConsultarDepartamentos()
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<DivisionDTO>> ConsultarDivisiones()
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<MarcaDTO>> ConsultarMarcas()
        {
            throw new NotImplementedException();
        }

        public Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoGrupoDTO acuerdo)
            => repo.CrearAsync(acuerdo);

        public Task<ArticuloDTO?> ObtenerArticuloPorId(int idArticulo)
        {
            throw new NotImplementedException();
        }
    }
}
