using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Opciones;
using AppAPL.Negocio.Abstracciones;

namespace AppAPL.Negocio.Servicios
{
    public sealed class OpcionServicio(IOpcionRepositorio repo) : IOpcionServicio
    {
        public Task<int> CrearAsync(CreateOpcionRequest req, CancellationToken ct)
            => repo.CrearAsync(req, ct);

        public Task ActualizarAsync(UpdateOpcionRequest req, CancellationToken ct)
            => repo.ActualizarAsync(req, ct);

        public Task EliminarLogicoAsync(int idOpcion, int idUsuario, CancellationToken ct)
            => repo.EliminarLogicoAsync(idOpcion, idUsuario, ct);

        public Task<OpcionDto?> ObtenerPorIdAsync(int idOpcion, CancellationToken ct)
            => repo.ObtenerPorIdAsync(idOpcion, ct);
        
        public Task<IEnumerable<OpcionDto>> ListarAsync(string? search, int page, int size, CancellationToken ct)
            => repo.ListarAsync(search, page, size, ct);
    }
}
