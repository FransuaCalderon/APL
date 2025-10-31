using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Opciones;
using AppAPL.Negocio.Abstracciones;

namespace AppAPL.Negocio.Servicios
{
    public sealed class OpcionServicio(IOpcionRepositorio repo) : IOpcionServicio
    {
        public Task<int> CrearAsync(CrearActualizarOpcionRequest opcion)
            => repo.CrearAsync(opcion);

        public Task ActualizarAsync(CrearActualizarOpcionRequest opcion, int IdOpcion)
            => repo.ActualizarAsync(opcion, IdOpcion);

        public Task EliminarAsync(int idOpcion)
            => repo.EliminarAsync(idOpcion);

        public Task<OpcionDTO?> ObtenerPorIdAsync(int idOpcion)
            => repo.ObtenerPorIdAsync(idOpcion);

        public Task<IEnumerable<OpcionDTO>> ListarAsync()
           => repo.ListarAsync();

        public Task<IEnumerable<OpcionJoinDTO>> ListarOpcionesAutorizadasInternas(int idUsuario)
            => repo.ListarOpcionesAutorizadasInternas(idUsuario);

        public Task<IEnumerable<ComboTipoServicioDTO>> ConsultarComboTipoServicio()
            => repo.ConsultarComboTipoServicio();
    }
}
