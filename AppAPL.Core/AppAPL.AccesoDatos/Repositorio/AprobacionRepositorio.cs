using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Aprobacion;
using Dapper;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class AprobacionRepositorio (OracleConnectionFactory factory, ILogger<AprobacionRepositorio> logger) : IAprobacionRepositorio
    {
        public async Task<IEnumerable<AprobacionGeneralDTO>> ObtenerAprobacionesGenerales(string entidad, int identidad,string? idTipoProceso = null)
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new 
            {
                p_entidad = entidad,
                p_identidad = identidad,
                p_idtipoproceso = idTipoProceso
            };
            var parameters = new OracleDynamicParameters(paramObject);

            
            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AprobacionGeneralDTO>(
                "apl_sp_consulta_aprobacion_general",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }


        public async Task<IEnumerable<AprobacionDTO>> ObtenerAprobaciones(string entidad, int identidad, string idTipoProceso)
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new
            {
                p_entidad = entidad,
                p_identidad = identidad,
                p_tipoproceso = idTipoProceso
            };
            var parameters = new OracleDynamicParameters(paramObject);


            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);


            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AprobacionDTO>(
                "apl_sp_consulta_aprobacion",
                parameters,
                commandType: CommandType.StoredProcedure
            );


            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }
    }
}
