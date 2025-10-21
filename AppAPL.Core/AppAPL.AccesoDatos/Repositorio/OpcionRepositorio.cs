
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Opciones;
using Dapper;
using Oracle.ManagedDataAccess.Client;
using System.Data;

namespace AppAPL_AccesoDatos.Repositorio
{
    public sealed class OpcionRepositorio(OracleConnectionFactory factory) : IOpcionRepositorio
    {
        public async Task<IEnumerable<OpcionJoinDTO>> ListarOpcionesPorRolAsync(string usuarioRol)
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters();
            parameters.Add("p_usuarioRol", OracleDbType.Varchar2, ParameterDirection.InputOutput, usuarioRol);
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);

            var opciones = await connection.QueryAsync<OpcionJoinDTO>(
                "sp_ListarOpciones", // Nombre completo del procedimiento
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return opciones;
        }

        public async Task<IEnumerable<OpcionDTO>> ListarAsync(
            string? nombre = null,
            int? idGrupo = null,
            int? idEstado = null,
            DateTime? creadoDesde = null,
            DateTime? creadoHasta = null,
            int pageNumber = 1,
            int pageSize = 50)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_nombre = nombre,
                p_idgrupo = idGrupo,
                p_idestado = idEstado,
                p_creado_desde = creadoDesde,
                p_creado_hasta = creadoHasta,
                p_page_number = pageNumber,
                p_page_size = pageSize
            };

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("o_cur", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("o_total", OracleDbType.Int32, ParameterDirection.Output);

            var datos = await connection.QueryAsync<OpcionDTO>(
                "APL_PKG_OPCIONES.listar",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int total = parameters.Get<int>("o_total");

            return datos;
        }

        public async Task<OpcionDTO?> ObtenerPorIdAsync(int idOpcion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new { p_idopcion = idOpcion };
            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("o_cur", OracleDbType.RefCursor, ParameterDirection.Output);

            var datos = await connection.QueryAsync<OpcionDTO>(
                "APL_PKG_OPCIONES.obtener_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return datos.FirstOrDefault();
        }


        public async Task<int> CrearAsync(CrearActualizarOpcionRequest opcion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_nombre = opcion.Nombre,
                p_descripcion = opcion.Descripcion,
                p_idgrupo = opcion.IdGrupo,
                p_vista = opcion.Vista,
                p_idusuariocreacion = opcion.IdUsuarioCreacion,
                p_idestado = opcion.IdEstado
            };

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("o_idopcion", OracleDbType.Int32, ParameterDirection.Output);

            await connection.ExecuteAsync(
                "APL_PKG_OPCIONES.crear",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return parameters.Get<int>("o_idopcion");
        }

        public async Task ActualizarAsync(CrearActualizarOpcionRequest opcion, int IdOpcion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idopcion = IdOpcion,
                p_nombre = opcion.Nombre,
                p_descripcion = opcion.Descripcion,
                p_idgrupo = opcion.IdGrupo,
                p_vista = opcion.Vista,
                p_idusuariomodificacion = opcion.IdUsuarioModificacion,
                p_idestado = opcion.IdEstado
            };

            var parameters = new OracleDynamicParameters(paramObject);

            await connection.ExecuteAsync(
                "APL_PKG_OPCIONES.actualizar",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task EliminarAsync(int idOpcion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new { p_idopcion = idOpcion };
            var parameters = new OracleDynamicParameters(paramObject);

            await connection.ExecuteAsync(
                "APL_PKG_OPCIONES.eliminar",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }





    }
}