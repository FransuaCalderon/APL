using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Promocion;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class PromocionRepositorio (OracleConnectionFactory factory, ILogger<PromocionRepositorio> logger) : IPromocionRepositorio
    {
        public async Task<IEnumerable<PromocionDTO>> ConsultarPromocion()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<PromocionDTO>(
                "select * from apl_tb_promocion",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }

        public async Task<IEnumerable<PromocionAcuerdoDTO>> ConsultarPromocionAcuerdo()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<PromocionAcuerdoDTO>(
                "select * from apl_tb_promocionacuerdo",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }

        public async Task<IEnumerable<PromocionArticuloDTO>> ConsultarPromocionArticulo()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<PromocionArticuloDTO>(
                "select * from apl_tb_promocionarticulo",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }

        public async Task<IEnumerable<PromocionSegmentoDTO>> ConsultarPromocionSegmento()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<PromocionSegmentoDTO>(
                "select * from apl_tb_promocionsegmento",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }

        public async Task<IEnumerable<PromocionSegmentoDetalleDTO>> ConsultarPromocionSegmentoDetalle()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<PromocionSegmentoDetalleDTO>(
                "select * from apl_tb_promocionsegmentodetalle",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }

        public async Task<IEnumerable<AlmacenDTO>> ConsultarAlmacen()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AlmacenDTO>(
                "select * from apl_tb_artefacta_almacen",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }


        public async Task<IEnumerable<ArticuloEquivalenteDTO>> ConsultarArticuloEquivalente()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<ArticuloEquivalenteDTO>(
                "select * from apl_tb_artefacta_articuloequivalente",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }


        public async Task<IEnumerable<ArticuloPrecioCompetenciaDTO>> ConsultarArticuloPrecioCompetencia()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<ArticuloPrecioCompetenciaDTO>(
                "select * from apl_tb_artefacta_articuloprecioscompetencia",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }

        public async Task<IEnumerable<CanalDTO>> ConsultarCanal()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<CanalDTO>(
                "select * from apl_tb_artefacta_canal",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }

        public async Task<IEnumerable<GrupoAlmacenDTO>> ConsultarGrupoAlmacen()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<GrupoAlmacenDTO>(
                "select * from apl_tb_artefacta_grupoalmacen",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }

        public async Task<IEnumerable<OtrosCostosDTO>> ConsultarOtrosCostos()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<OtrosCostosDTO>(
                "select * from apl_tb_artefacta_otroscostos",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }

        public async Task<IEnumerable<TipoClienteDTO>> ConsultarTipoCliente()
        {
            using var connection = factory.CreateOpenConnection();

            /*
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            */

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<TipoClienteDTO>(
                "select * from apl_tb_artefacta_tipocliente",
                null, //aqui van los parametros
                commandType: CommandType.Text
            );


            /*
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            */

            return datos;

        }


    }
}
