using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto;
using AppAPL.Dto.Promocion;
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
    public class ValidacionAporteRepositorio(OracleConnectionFactory factory, ILogger<ValidacionAporteRepositorio> logger) : IValidacionAporteRepositorio
    {

        public async Task<IEnumerable<AportesPorMarcaDTO>> ConsultarAportesPorMarca(string codigoMarca)
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_codigo_marca = codigoMarca };
            logger.LogInformation($"parametros para enviar al sp: {paramObject}");

            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AportesPorMarcaDTO>(
                "validacionesAporte2.sp_AportesPorMarca",
                parameters, //aqui van los parametros
                commandType: CommandType.StoredProcedure
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");*/


            return datos;
        }


        public async Task<IEnumerable<AportesPorArticuloDTO>> ConsultarAportesPorArticulo(string codigoArticulo)
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_codigo_articulo = codigoArticulo };
            logger.LogInformation($"parametros para enviar al sp: {paramObject}");

            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AportesPorArticuloDTO>(
                "validacionesAporte2.sp_AportesPorArticulo",
                parameters, //aqui van los parametros
                commandType: CommandType.StoredProcedure
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");*/


            return datos;
        }

        public async Task<IEnumerable<AportesPorMarcaProveedorDTO>> ConsultarAportesPorMarcaProveedor(string codigoMarca, string identificacion)
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new 
            {
                p_codigo_marca = codigoMarca,
                p_identificacion_prov = identificacion
            };
            logger.LogInformation($"parametros para enviar al sp: {paramObject}");

            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AportesPorMarcaProveedorDTO>(
                "validacionesAporte2.sp_AportesPorMarcaProveedor",
                parameters, //aqui van los parametros
                commandType: CommandType.StoredProcedure
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");*/


            return datos;
        }
    }
}
