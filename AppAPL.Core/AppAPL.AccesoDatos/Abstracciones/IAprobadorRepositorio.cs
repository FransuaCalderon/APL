using AppAPL.Dto.Aprobador;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IAprobadorRepositorio
    {
        Task<long> CrearAsync(CrearAprobadorRequest request);
        Task<IEnumerable<AprobadorDTO>> ListarAsync();
        Task<AprobadorDTO?> ObtenerPorIdAsync(long idAprobador);
        Task ActualizarAsync(ActualizarAprobadorRequest request);
        Task EliminarAsync(EliminarAprobadorRequest request);
    }
}