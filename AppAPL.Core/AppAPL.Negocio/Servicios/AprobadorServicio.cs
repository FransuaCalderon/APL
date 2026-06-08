using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Aprobador;
using AppAPL.Dto.Parametros;
using AppAPL.Negocio.Abstracciones;

namespace AppAPL.Negocio.Servicios
{
  public sealed class AprobadorServicio(IAprobadorRepositorio repo) : IAprobadorServicio
  {
        public Task<IEnumerable<AprobadorDTO>> ListarAsync()
            => repo.ListarAsync();

        public Task<AprobadorDTO?> ObtenerPorIdAsync(long idAprobador)
            => repo.ObtenerPorIdAsync(idAprobador);

        public Task<long> CrearAsync(CrearAprobadorRequest aprobador)
            => repo.CrearAsync(aprobador);

        public Task ActualizarAsync(ActualizarAprobadorRequest aprobador)
            => repo.ActualizarAsync(aprobador);

        public Task EliminarAsync(EliminarAprobadorRequest aprobador)
            => repo.EliminarAsync(aprobador);
  }
}