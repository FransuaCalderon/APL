
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
        public async Task<IEnumerable<OpcionDto>> ListarAsync(string? search, int page, int size, CancellationToken ct)
        {
            using var conn = factory.CreateOpenConnection();

            var parametros = new OracleDynamicParameters(new
            {
                P_SEARCH = search ?? (object)DBNull.Value,
                P_PAGE_NUMBER = page,
                P_PAGE_SIZE = size
            });

            // Parámetro de salida para el total de registros
            parametros.Add("P_TOTAL_ROWS", dbType: DbType.Int32, direction: ParameterDirection.Output);
            // Parámetro de salida tipo cursor
            parametros.Add("P_CURSOR", dbType: (DbType)OracleDbType.RefCursor, direction: ParameterDirection.Output);

            var items = await conn.QueryAsync<OpcionDto>(
                "APL_PKG_OPCION.LISTAR",
                parametros,
                commandType: CommandType.StoredProcedure
            );

            var totalRows = parametros.Get<int>("P_TOTAL_ROWS");

            // Si luego usas un PagedResult, puedes devolverlo así:
            // return new PagedResult<OpcionDto>(totalRows, items);

            return items;
        }

        public async Task<OpcionDto?> ObtenerPorIdAsync(int idOpcion, CancellationToken ct)
        {
            using var conn = factory.CreateOpenConnection();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "APL_PKG_OPCION.GET_BY_ID";
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.Add("P_IDOPCION", OracleDbType.Int32).Value = idOpcion;
            var cur = cmd.Parameters.Add("P_CURSOR", OracleDbType.RefCursor);
            cur.Direction = ParameterDirection.Output;

            using var reader = await cmd.ExecuteReaderAsync(ct);
            if (!reader.HasRows) return null;
            await reader.ReadAsync(ct);
            return new OpcionDto(
                IdOpcion: reader.GetInt32(reader.GetOrdinal("IDOPCION")),
                Nombre: reader.GetString(reader.GetOrdinal("NOMBRE")),
                Descripcion: reader.GetString(reader.GetOrdinal("DESCRIPCION")),
                IdGrupo: reader.GetInt32(reader.GetOrdinal("IDGRUPO")),
                Vista: reader.GetString(reader.GetOrdinal("VISTA")),
                IdEstado: reader.GetInt32(reader.GetOrdinal("IDESTADO"))
            );
        }


        public async Task<int> CrearAsync(CreateOpcionRequest req, CancellationToken ct)
        {
            using var conn = factory.CreateOpenConnection();

            var parametros = new OracleDynamicParameters(new
            {
                P_NOMBRE = req.Nombre.Trim(),
                P_DESCRIPCION = req.Descripcion.Trim(),
                P_IDGRUPO = req.IdGrupo,
                P_VISTA = req.Vista.Trim(),
                P_IDUSUARIOCREACION = req.IdUsuarioCreacion,
                P_IDESTADO = req.IdEstado
            });

            // Agregamos el parámetro de salida aparte
            parametros.Add("P_ID_OUT", dbType: DbType.Int32, direction: ParameterDirection.Output);

            await conn.ExecuteAsync(
                "APL_PKG_OPCION.CREATE_OPCION",
                parametros,
                commandType: CommandType.StoredProcedure
            );

            return parametros.Get<int>("P_ID_OUT");
        }

        public async Task ActualizarAsync(UpdateOpcionRequest req, CancellationToken ct)
        {
            using var conn = factory.CreateOpenConnection();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "APL_PKG_OPCION.UPDATE_OPCION";
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.Add("P_IDOPCION", OracleDbType.Int32).Value = req.IdOpcion;
            cmd.Parameters.Add("P_NOMBRE", OracleDbType.Varchar2).Value = req.Nombre.Trim();
            cmd.Parameters.Add("P_DESCRIPCION", OracleDbType.Varchar2).Value = req.Descripcion.Trim();
            cmd.Parameters.Add("P_IDGRUPO", OracleDbType.Int32).Value = req.IdGrupo;
            cmd.Parameters.Add("P_VISTA", OracleDbType.Varchar2).Value = req.Vista.Trim();
            cmd.Parameters.Add("P_IDUSUARIOMODIFICACION", OracleDbType.Int32).Value = req.IdUsuarioModificacion;
            cmd.Parameters.Add("P_IDESTADO", OracleDbType.Int32).Value = req.IdEstado;

            await cmd.ExecuteNonQueryAsync(ct);
        }

        public async Task EliminarLogicoAsync(int idOpcion, int idUsuario, CancellationToken ct)
        {
            using var conn = factory.CreateOpenConnection();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "APL_PKG_OPCION.DELETE_OPCION";
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.Add("P_IDOPCION", OracleDbType.Int32).Value = idOpcion;
            cmd.Parameters.Add("P_IDUSUARIOMODIFICACION", OracleDbType.Int32).Value = idUsuario;

            await cmd.ExecuteNonQueryAsync(ct);
        }

        


        
    }
}