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

        public Task<IEnumerable<ArticuloDTO>> ConsultarArticulos(ConsultarArticuloDTO dto)
            => repo.ConsultarArticulos(dto);

        public Task<IEnumerable<ClaseDTO>> ConsultarClases()
            => repo.ConsultarClases();

        public Task<IEnumerable<DepartamentoDTO>> ConsultarDepartamentos()
            => repo.ConsultarDepartamentos();

        public Task<IEnumerable<DivisionDTO>> ConsultarDivisiones()
            => repo.ConsultarDivisiones();

        public Task<IEnumerable<MarcaDTO>> ConsultarMarcas()
            => repo.ConsultarMarcas();

        public Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoGrupoDTO acuerdo)
            => repo.CrearAsync(acuerdo);
        /*
        public Task<ArticuloDTO?> ObtenerArticuloPorId(int idArticulo)
        {
            throw new NotImplementedException();
        }*/
    }
}
