using AppAPL.Dto.Opciones;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IOpcionRepositorio
    {
        Task ActualizarAsync(CrearActualizarOpcionRequest opcion, int IdOpcion);
        Task<int> CrearAsync(CrearActualizarOpcionRequest opcion);
        Task EliminarAsync(int idOpcion);
        Task<IEnumerable<OpcionDTO>> ListarAsync(string? nombre = null, int? idGrupo = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50);
        Task<IEnumerable<OpcionJoinDTO>> ListarOpcionesAutorizadasInternas(int idUsuario);
        Task<OpcionDTO?> ObtenerPorIdAsync(int idOpcion);
    }
}
