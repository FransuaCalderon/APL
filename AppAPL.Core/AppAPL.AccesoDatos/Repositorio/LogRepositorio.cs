using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Log;
using Dapper;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class LogRepositorio(OracleConnectionFactory factory) : ILogRepositorio
    {
        public async Task<IEnumerable<LogDTO>> ObtenerLogsPorUsuarioAsync(
        int idUser,
        DateTime? fechaInicio = null,
        DateTime? fechaFin = null)
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters(new
            {
                P_IDUSER = idUser,
                P_FECHA_INICIO = fechaInicio,
                P_FECHA_FIN = fechaFin
            });

            parameters.Add("P_CURSOR", OracleDbType.RefCursor, ParameterDirection.Output);

            return await connection.QueryAsync<LogDTO>(
                "APL_PKG_LOGS_SISTEMA.PR_OBTENER_LOGS_USUARIO",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<IEnumerable<LogDTO>> ObtenerLogsPorOpcionAsync(
            int idOpcion,
            DateTime? fechaInicio = null,
            DateTime? fechaFin = null)
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters(new
            {
                P_IDOPCION = idOpcion,
                P_FECHA_INICIO = fechaInicio,
                P_FECHA_FIN = fechaFin
            });

            parameters.Add("P_CURSOR", OracleDbType.RefCursor, ParameterDirection.Output);

            return await connection.QueryAsync<LogDTO>(
                "APL_PKG_LOGS_SISTEMA.PR_OBTENER_LOGS_OPCION",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }

        // ✅ Registrar Log GENERAL
        public async Task RegistrarLogNombreAsync(CrearActualizarLogRequest log)
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters(new
            {
                P_IDUSER = log.IdUser,
                P_NOMBRE_OPCION = log.Nombre_Opcion,
                P_IDEVENTO = log.IdEvento,
                P_DATOS = log.Datos
            });

            await connection.ExecuteAsync(
                "APL_PKG_LOGS_SISTEMA.PR_REGISTRAR_LOG",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }

        // ✅ Registrar Log POR OPCIÓN
        public async Task RegistrarLogOpcionAsync(CrearActualizarLogRequest log)
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters(new
            {
                P_IDUSER = log.IdUser,
                P_IDOPCION = log.IdOpcion,
                P_IDEVENTO = log.IdEvento,
                P_DATOS = log.Datos
            });

            await connection.ExecuteAsync(
                "APL_PKG_LOGS_SISTEMA.PR_REGISTRAR_LOG",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }
    }
}
