using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Log;
using Dapper;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class LogRepositorio(OracleConnectionFactory factory, ILogger<LogRepositorio> logger) : ILogRepositorio
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
        /*
        // ✅ Registrar Log GENERAL
        public async Task RegistrarLogNombreAsync(CrearActualizarLogRequest log)
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters(new
            {
                P_IDUSER = log.IdUser,
                P_NOMBRE_OPCION = log.Nombre_Opcion,
                P_IDEVENTO = log.IdEvento,  //falta agregar parametros para el campo de IDCONTROLINTERFAZ  
                P_DATOS = log.Datos
            });

            await connection.ExecuteAsync(
                "APL_PKG_LOGS_SISTEMA.PR_REGISTRAR_LOG",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }*/

        // ✅ Registrar Log POR OPCIÓN
        public async Task RegistrarLogOpcionAsync(CrearActualizarLogRequest log)
        {
            using var connection = factory.CreateOpenConnection();
            /*
            var parametros = new
            {
                P_IDUSER = log.IdUser,
                P_IDOPCION = log.IdOpcion,  //falta agregar parametros para el campo de IDCONTROLINTERFAZ  
                P_IDEVENTO = log.IdEvento,
                P_DATOS = log.Datos
            };

            logger.LogInformation($"parametros : {parametros.ToString()}");

            var parameters = new OracleDynamicParameters(parametros);

            await connection.ExecuteAsync(
                @"BEGIN 
                    APL_PKG_LOGS_SISTEMA.PR_REGISTRAR_LOG(:P_IDUSER, :P_IDOPCION, :P_IDEVENTO, :P_DATOS); 
                  END;",
                parameters,
                commandType: CommandType.Text
            );*/

            string sql = @"
                INSERT INTO APL_TB_LOG (
                    IDUSER,
                    IDOPCION,
                    IDCONTROLINTERFAZ,
                    IDEVENTO,
                    ENTIDAD,
                    IDENTIDAD,
                    IDTIPOPROCESO,
                    DATOS
                )
                VALUES (
                    :P_IDUSER,
                    :P_IDOPCION,
                    :P_IDCONTROLINTERFAZ,
                    :P_IDEVENTO,
                    :P_ENTIDAD,
                    :P_IDENTIDAD,
                    :P_IDTIPOPROCESO,
                    :P_DATOS
                )";

            var parameters = new
            {
                P_IDUSER = log.IdUser,
                P_IDOPCION = log.IdOpcion,
                P_IDCONTROLINTERFAZ = log.IdControlInterfaz,
                P_IDEVENTO = log.IdEvento,
                P_ENTIDAD = log.Entidad,
                P_IDENTIDAD = log.IdEntidad,
                P_IDTIPOPROCESO = log.IdTipoProceso,
                P_DATOS = log.Datos // debe ser un JSON string válido
            };

            await connection.ExecuteAsync(sql, parameters);
        }
    }
}
