using AppAPL.Dto.Opciones;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IOpcionServicio
    {
        Task ActualizarAsync(CrearActualizarOpcionRequest opcion, int IdOpcion);
        Task<int> CrearAsync(CrearActualizarOpcionRequest opcion);
        Task EliminarAsync(int idOpcion);
        Task<IEnumerable<OpcionDTO>> ListarAsync(string? nombre = null, int? idGrupo = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50);
        Task<OpcionDTO?> ObtenerPorIdAsync(int idOpcion);
        Task<IEnumerable<OpcionJoinDTO>> ListarOpcionesAutorizadasInternas(int idUsuario);
    }
}
