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

        Task<IEnumerable<MarcaDTO>> ConsultarMarcas();
        Task<IEnumerable<DivisionDTO>> ConsultarDivisiones();
        Task<IEnumerable<DepartamentoDTO>> ConsultarDepartamentos();
        Task<IEnumerable<ClaseDTO>> ConsultarClases();
        Task<IEnumerable<ArticuloDTO>> ConsultarArticulos(int idMarca, int idDivision, int idDepartamento, int idClase);
        Task<ArticuloDTO?> ObtenerArticuloPorId(int idArticulo);

        Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoDTO acuerdo);
    }
}
