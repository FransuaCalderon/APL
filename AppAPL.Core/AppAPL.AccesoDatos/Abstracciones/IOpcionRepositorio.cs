using AppAPL.Dto.Opciones;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IOpcionRepositorio
    {
        Task<int> CrearAsync(CreateOpcionRequest req, CancellationToken ct);
        Task ActualizarAsync(UpdateOpcionRequest req, CancellationToken ct);
        Task EliminarLogicoAsync(int idOpcion, int idUsuario, CancellationToken ct);
        Task<OpcionDto?> ObtenerPorIdAsync(int idOpcion, CancellationToken ct);
        Task<IEnumerable<OpcionDto>> ListarAsync(string? search, int page, int size, CancellationToken ct);
    }
}
