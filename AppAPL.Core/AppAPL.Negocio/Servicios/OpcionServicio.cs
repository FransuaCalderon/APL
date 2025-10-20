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

        public Task<IEnumerable<OpcionDTO>> ListarAsync(string? nombre = null, int? idGrupo = null, int? idEstado = null, DateTime? creadoDesde = null, DateTime? creadoHasta = null, int pageNumber = 1, int pageSize = 50)
           => repo.ListarAsync(nombre,idGrupo, idEstado, creadoDesde, creadoHasta, pageNumber, pageSize);

        public Task<IEnumerable<OpcionJoinDTO>> ListarOpcionesPorRolAsync(string usuarioRol)
            => repo.ListarOpcionesPorRolAsync(usuarioRol);
    }
}
