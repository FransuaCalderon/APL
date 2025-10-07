using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Opciones;
using Oracle.ManagedDataAccess.Client;
using System.Data;

namespace AppAPL.AccesoDatos.Oracle
{
    public sealed class OpcionRepositorio(OracleConnectionFactory factory) : IOpcionRepositorio
    {
        public async Task<int> CrearAsync(CreateOpcionRequest req, CancellationToken ct)
        {
            using var conn = factory.CreateOpenConnection();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "APL.PKG_OPCION.CREATE_OPCION";
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.Add("P_NOMBRE", OracleDbType.Varchar2).Value = req.Nombre.Trim();
            cmd.Parameters.Add("P_DESCRIPCION", OracleDbType.Varchar2).Value = req.Descripcion.Trim();
            cmd.Parameters.Add("P_IDGRUPO", OracleDbType.Int32).Value = req.IdGrupo;
            cmd.Parameters.Add("P_VISTA", OracleDbType.Varchar2).Value = req.Vista.Trim();
            cmd.Parameters.Add("P_IDUSUARIOCREACION", OracleDbType.Int32).Value = req.IdUsuarioCreacion;
            cmd.Parameters.Add("P_IDESTADO", OracleDbType.Int32).Value = req.IdEstado;
            var pOut = cmd.Parameters.Add("P_ID_OUT", OracleDbType.Int32);
            pOut.Direction = ParameterDirection.Output;

            await cmd.ExecuteNonQueryAsync(ct);
            return Convert.ToInt32(pOut.Value.ToString());
        }

        public async Task ActualizarAsync(UpdateOpcionRequest req, CancellationToken ct)
        {
            using var conn = factory.CreateOpenConnection();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "APL.PKG_OPCION.UPDATE_OPCION";
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
            cmd.CommandText = "APL.PKG_OPCION.DELETE_OPCION";
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.Add("P_IDOPCION", OracleDbType.Int32).Value = idOpcion;
            cmd.Parameters.Add("P_IDUSUARIOMODIFICACION", OracleDbType.Int32).Value = idUsuario;

            await cmd.ExecuteNonQueryAsync(ct);
        }

        public async Task<OpcionDto?> ObtenerPorIdAsync(int idOpcion, CancellationToken ct)
        {
            using var conn = factory.CreateOpenConnection();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "APL.PKG_OPCION.GET_BY_ID";
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

        public async Task<PagedResult<OpcionDto>> ListarAsync(string? search, int page, int size, CancellationToken ct)
        {
            using var conn = factory.CreateOpenConnection();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "APL.PKG_OPCION.LIST_PAGED";
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.Add("P_SEARCH", OracleDbType.Varchar2).Value = (object?)search ?? DBNull.Value;
            cmd.Parameters.Add("P_PAGE_NUMBER", OracleDbType.Int32).Value = page;
            cmd.Parameters.Add("P_PAGE_SIZE", OracleDbType.Int32).Value = size;
            var total = cmd.Parameters.Add("P_TOTAL_ROWS", OracleDbType.Int32);
            total.Direction = ParameterDirection.Output;

            var cur = cmd.Parameters.Add("P_CURSOR", OracleDbType.RefCursor);
            cur.Direction = ParameterDirection.Output;

            var items = new List<OpcionDto>();
            using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                items.Add(new OpcionDto(
                    reader.GetInt32(reader.GetOrdinal("IDOPCION")),
                    reader.GetString(reader.GetOrdinal("NOMBRE")),
                    reader.GetString(reader.GetOrdinal("DESCRIPCION")),
                    reader.GetInt32(reader.GetOrdinal("IDGRUPO")),
                    reader.GetString(reader.GetOrdinal("VISTA")),
                    reader.GetInt32(reader.GetOrdinal("IDESTADO"))
                ));
            }
            var totalRows = Convert.ToInt32(total.Value.ToString());
            return new PagedResult<OpcionDto>(totalRows, items);
        }
    }
}