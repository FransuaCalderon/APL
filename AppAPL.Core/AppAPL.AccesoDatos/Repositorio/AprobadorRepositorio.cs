using System.Data;
using System.Text.Json;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Aprobador;
using Dapper;
using Oracle.ManagedDataAccess.Client;

namespace AppAPL.AccesoDatos.Repositorio
{
  public sealed class AprobadorRepositorio(OracleConnectionFactory factory) : IAprobadorRepositorio
  {
    
    private const int C_OK = 0;

    // ============================================================
    // 'CT' : Consulta de lista de aprobadores activos
    // ============================================================
    public async Task<IEnumerable<AprobadorDTO>> ListarAsync()
    {
      using var connection = factory.CreateOpenConnection();

      var parameters = new OracleDynamicParameters(new { p_opcion = "CT" });
      parameters.Add("p_json", OracleDbType.Clob, ParameterDirection.Output);
      parameters.Add("p_idaprobador_out", OracleDbType.Int64, ParameterDirection.Output);
      parameters.Add("p_codigoretorno", OracleDbType.Int32, ParameterDirection.Output);
      parameters.Add("p_mensaje", OracleDbType.Varchar2, ParameterDirection.Output, size: 4000);

      await connection.ExecuteAsync(
        "APL_PKG_APROBADOR.SP_MANTENIMIENTO",
        parameters,
        commandType: CommandType.StoredProcedure
      );

      ValidarRetorno(parameters);

      var json = parameters.Get<string?>("p_json");
        if (string.IsNullOrWhiteSpace(json))
            return Enumerable.Empty<AprobadorDTO>();

      return JsonSerializer.Deserialize<List<AprobadorDTO>>(json) ?? new List<AprobadorDTO>();

    }

    // ============================================================
    // 'CE' : Consulta especifica de un aprobador
    // ============================================================
    public async Task<AprobadorDTO?> ObtenerPorIdAsync(long idAprobador)
    {
        using var connection = factory.CreateOpenConnection();

        var parameters = new OracleDynamicParameters(new
        {
            p_opcion = "CE",
            p_idaprobador = idAprobador
        });
        parameters.Add("p_json", OracleDbType.Clob, ParameterDirection.Output);
        parameters.Add("p_idaprobador_out", OracleDbType.Int64, ParameterDirection.Output);
        parameters.Add("p_codigoretorno", OracleDbType.Int32, ParameterDirection.Output);
        parameters.Add("p_mensaje", OracleDbType.Varchar2, ParameterDirection.Output, size: 4000);

        await connection.ExecuteAsync(
            "APL_PKG_APROBADOR.SP_MANTENIMIENTO",
            parameters,
            commandType: CommandType.StoredProcedure
        );

        ValidarRetorno(parameters);

        var json = parameters.Get<string?>("p_json");
        if (string.IsNullOrWhiteSpace(json))
            return null;

        return JsonSerializer.Deserialize<AprobadorDTO>(json);
    }

    // ============================================================
    // 'I' : Ingreso de nuevo aprobador
    // ============================================================
    public async Task<long> CrearAsync(CrearAprobadorRequest request)
    {
        using var connection = factory.CreateOpenConnection();

        var paramObject = new
        {
            p_opcion = "I",
            p_entidad = request.Entidad,
            p_idtipoproceso = request.IdTipoProceso,
            p_iduseraprobador = request.IdUserAprobador,
            p_nivelaprobacion = request.NivelAprobacion,
            p_idusuario = request.IdUsuario
        };

        var parameters = new OracleDynamicParameters(paramObject);
        parameters.Add("p_json", OracleDbType.Clob, ParameterDirection.Output);
        parameters.Add("p_idaprobador_out", OracleDbType.Int64, ParameterDirection.Output);
        parameters.Add("p_codigoretorno", OracleDbType.Int32, ParameterDirection.Output);
        parameters.Add("p_mensaje", OracleDbType.Varchar2, ParameterDirection.Output, size: 4000);

        await connection.ExecuteAsync(
            "APL_PKG_APROBADOR.SP_MANTENIMIENTO",
            parameters,
            commandType: CommandType.StoredProcedure
        );

        ValidarRetorno(parameters);

        return parameters.Get<long>("p_idaprobador_out");
    }
    
    // ============================================================
    // 'M' : Modificacion de aprobador
    // ============================================================
    public async Task ActualizarAsync(ActualizarAprobadorRequest request)
    {
        using var connection = factory.CreateOpenConnection();

        var paramObject = new
        {
            p_opcion = "M",
            p_idaprobador = request.IdAprobador,
            p_iduseraprobador = request.IdUserAprobador,
            p_nivelaprobacion = request.NivelAprobacion,
            p_idusuario = request.IdUsuario
        };

        var parameters = new OracleDynamicParameters(paramObject);
        parameters.Add("p_json", OracleDbType.Clob, ParameterDirection.Output);
        parameters.Add("p_idaprobador_out", OracleDbType.Int64, ParameterDirection.Output);
        parameters.Add("p_codigoretorno", OracleDbType.Int32, ParameterDirection.Output);
        parameters.Add("p_mensaje", OracleDbType.Varchar2, ParameterDirection.Output, size: 4000);

        await connection.ExecuteAsync(
            "APL_PKG_APROBADOR.SP_MANTENIMIENTO",
            parameters,
            commandType: CommandType.StoredProcedure
        );

        ValidarRetorno(parameters);
    }

    
    // ============================================================
    // 'E' : Eliminacion logica de aprobador
    // ============================================================
    public async Task EliminarAsync(EliminarAprobadorRequest request)
    {
        using var connection = factory.CreateOpenConnection();

        var paramObject = new
        {
            p_opcion = "E",
            p_idaprobador = request.IdAprobador,
            p_idusuario = request.IdUsuario
        };

        var parameters = new OracleDynamicParameters(paramObject);
        parameters.Add("p_json", OracleDbType.Clob, ParameterDirection.Output);
        parameters.Add("p_idaprobador_out", OracleDbType.Int64, ParameterDirection.Output);
        parameters.Add("p_codigoretorno", OracleDbType.Int32, ParameterDirection.Output);
        parameters.Add("p_mensaje", OracleDbType.Varchar2, ParameterDirection.Output, size: 4000);

        await connection.ExecuteAsync(
            "APL_PKG_APROBADOR.SP_MANTENIMIENTO",
            parameters,
            commandType: CommandType.StoredProcedure
        );

        ValidarRetorno(parameters);
    }


    // ============================================================
    // Helper: valida p_codigoretorno y lanza si hubo error
    // ============================================================
    private static void ValidarRetorno(OracleDynamicParameters parameters)
    {
        int codigo = parameters.Get<int>("p_codigoretorno");
        if (codigo != C_OK)
        {
            string mensaje = parameters.Get<string?>("p_mensaje") ?? "Error desconocido en SP_MANTENIMIENTO.";
            throw new InvalidOperationException(mensaje);
        }
    }
  }
}