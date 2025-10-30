using AppAPL.Dto.Opciones;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IOpcionRepositorio
    {
        Task ActualizarAsync(CrearActualizarOpcionRequest opcion, int IdOpcion);
        Task<int> CrearAsync(CrearActualizarOpcionRequest opcion);
        Task EliminarAsync(int idOpcion);
        Task<IEnumerable<OpcionDTO>> ListarAsync();
        Task<IEnumerable<OpcionJoinDTO>> ListarOpcionesAutorizadasInternas(int idUsuario);
        Task<OpcionDTO?> ObtenerPorIdAsync(int idOpcion);
    }
}
