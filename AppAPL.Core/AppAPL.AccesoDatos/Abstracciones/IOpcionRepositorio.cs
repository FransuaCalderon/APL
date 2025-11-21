using AppAPL.Dto.Catalogo;
using AppAPL.Dto.Opciones;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IOpcionRepositorio
    {
        Task ActualizarAsync(CrearActualizarOpcionRequest opcion, int IdOpcion);
        Task<int> CrearAsync(CrearActualizarOpcionRequest opcion);
        Task EliminarAsync(int idOpcion);
        Task<IEnumerable<OpcionDTO>> ListarAsync(string NombreUsuario);
        Task<IEnumerable<OpcionJoinDTO>> ListarOpcionesAutorizadasInternas(string NombreUsuario);
        Task<OpcionDTO?> ObtenerPorIdAsync(int idOpcion);
        Task<IEnumerable<ComboDTO>> ConsultarCombos(string etiqueta);
    }
}
