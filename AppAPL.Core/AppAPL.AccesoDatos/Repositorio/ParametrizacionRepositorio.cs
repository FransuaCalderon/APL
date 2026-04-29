using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Parametrizacion;
using Dapper;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class ParametrizacionRepositorio (OracleConnectionFactory factory, ILogger<ParametrizacionRepositorio> logger) : IParametrizacionRepositorio
    {
        public async Task<IEnumerable<ParametroConfigDTO>> ConsultarParametros()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<ParametroConfigDTO>(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_CONSULTA_PARAMETROS",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<GruposAlmacenConfigDTO>> ConsultarGrupoAlmacen()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<GruposAlmacenConfigDTO>(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_CONSULTA_GRUPOS_ALMACEN",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<AlmacenesGrupoConfigDTO>> ConsultarAlmacenGrupo(int codigo)
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_codigo = codigo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AlmacenesGrupoConfigDTO>(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_CONSULTA_ALMACENES_GRUPO",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<MediosPagoConfigDTO>> ConsultarMediosPago()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_codigo = codigo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<MediosPagoConfigDTO>(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_CONSULTA_MEDIOS_PAGO",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<AportesMarcaDTO>> ConsultarAportesMarca()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_codigo = codigo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AportesMarcaDTO>(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_CONSULTA_APORTES_MARCA",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<AportesMarcaProvDTO>> ConsultarAportesMarcaProv()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_codigo = codigo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AportesMarcaProvDTO>(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_CONSULTA_APORTES_MARCA_PROV",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<AportesArticuloDTO>> ConsultarAportesArticulo()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_codigo = codigo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AportesArticuloDTO>(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_CONSULTA_APORTES_ARTICULO",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<PreciosCompetenciaDTO>> ConsultarPreciosCompetencia()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_codigo = codigo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<PreciosCompetenciaDTO>(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_CONSULTA_PRECIOS_COMPETENCIA",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<MargenMinimoDTO>> ConsultarMargenMinimo()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_codigo = codigo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<MargenMinimoDTO>(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_CONSULTA_MARGEN_MINIMO",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<PorcIncrementoDTO>> ConsultarPorcIncremento()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_codigo = codigo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<PorcIncrementoDTO>(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_CONSULTA_PORC_INCREMENTO",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }


        public async Task<IEnumerable<OtrosCostosConfigDTO>> ConsultarOtrosCostos()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_codigo = codigo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<OtrosCostosConfigDTO>(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_CONSULTA_OTROS_COSTOS",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }


        public async Task<MantenimientoParametrosResponseDTO> MantParametros(MantenimientoParametrosRequestDTO request)
        {

            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_tipo_mant = request.tipo_mant,
                p_opcion = request.opcion,
                p_idparametro = request.idparametro,
                p_idparametrotipo = request.idparametrotipo,
                p_nombre = request.nombre,
                p_codigoparametro = request.codigoparametro,
                p_idusuario = request.idusuario,
                p_idparametrodato = request.idparametrodato,
                p_codigorelacion1 = request.codigorelacion1,
                p_codigorelacion2 = request.codigorelacion2,
                p_codigorelacion3 = request.codigorelacion3,
                p_codigorelacion4 = request.codigorelacion4,
                p_codigorelacion5 = request.codigorelacion5,
                p_valor1 = request.valor1,
                p_valor2 = request.valor2,
                p_valor3 = request.valor3,
                p_valor4 = request.valor4,
                p_valor5 = request.valor5
            };

            //logger.LogInformation($"inactivar acuerdo parametros sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);

            //parameters.Add("p_cursor_promociones", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_out_idparametro", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_out_codigoparametro", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_out_idparametrodato", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_cod_respuesta", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_msg_respuesta", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            int filasAfectadas = await connection.ExecuteAsync(
                "APL_PKG_CONFIGURA_PARAMETRO.PR_MANTENIMIENTO_PARAMETROS",
                parameters,
                commandType: CommandType.StoredProcedure
            );


            int? idParametro = parameters.Get<int>("p_out_idparametro");
            int? codigoParametro = parameters.Get<int>("p_out_codigoparametro");
            int? idParametroDato = parameters.Get<int>("p_out_idparametrodato");
            int? codigoSalida = parameters.Get<int>("p_cod_respuesta");
            string? mensajeSalida = parameters.Get<string>("p_msg_respuesta");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");


            var retorno = new MantenimientoParametrosResponseDTO()
            {
                idparametro = idParametro,
                codigoparametro = codigoParametro,
                idparametrodato = idParametroDato,
                cod_respuesta = codigoSalida,
                msg_respuesta = mensajeSalida
            };

            return retorno;
        }
    }
}
