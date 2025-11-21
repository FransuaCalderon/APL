using AppAPL.Dto.Opciones;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IOpcionServicio
    {
        Task ActualizarAsync(CrearActualizarOpcionRequest opcion, int IdOpcion);
        Task<int> CrearAsync(CrearActualizarOpcionRequest opcion);
        Task EliminarAsync(int idOpcion);
        Task<IEnumerable<OpcionJoinDTO>> ListarAsync(string NombreUsuario);
        Task<OpcionDTO?> ObtenerPorIdAsync(int idOpcion);
        Task<IEnumerable<OpcionJoinDTO>> ListarOpcionesAutorizadasInternas(int idUsuario);
        Task<IEnumerable<ComboDTO>> ConsultarCombos(string etiqueta);
    }
}
