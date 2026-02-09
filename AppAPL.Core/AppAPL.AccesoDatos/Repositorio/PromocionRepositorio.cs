using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Opciones;
using AppAPL.Dto.Promocion;
using Dapper;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

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

        public async Task<GruposPromocionesDTO> CargarCombosPromociones()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Parámetros de Salida (RefCursors)
            var parameters = new OracleDynamicParameters();

            // Agregar los 4 RefCursors como parámetros de salida
            parameters.Add("p_rc_canal", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_rc_grupo", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_rc_almacen", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_rc_tipocliente", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_rc_mediopago", OracleDbType.RefCursor, ParameterDirection.Output);

            // 2. REGISTRO DE PARÁMETROS DE ENTRADA (OPCIONALES)
            // Solo los agregamos si tienen valor. Si son null, el SP usará sus DEFAULTS.
            /*
            if (!string.IsNullOrWhiteSpace(consultar.codigoAlmacen))
            {
                parameters.Add("p_codigo_almacen", OracleDbType.Varchar2, ParameterDirection.Input, consultar.codigoAlmacen);
            }

            if (consultar.incluirTodos.HasValue)
            {
                parameters.Add("p_incluir_todos", OracleDbType.Int32, ParameterDirection.Input, consultar.incluirTodos.HasValue);
            }*/

            // 🔹 Ejecutar el SP con QueryMultiple
            using var multi = await connection.QueryMultipleAsync(
                "APL_SP_GRUPO_SELECT_ARTEFACTA_PROMOCIONES",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            // 🔹 Leer cada conjunto de resultados en el ORDEN en que están definidos en el SP
            var resultado = new GruposPromocionesDTO
            {
                Canales = await multi.ReadAsync<CanalDTO>(),
                GruposAlmacenes = await multi.ReadAsync<GrupoAlmacenDTO>(),
                Almacenes = await multi.ReadAsync<AlmacenDTO>(),
                TiposClientes = await multi.ReadAsync<TipoClienteDTO>(),
                MediosPagos = await multi.ReadAsync<MedioPagoDTO>()
            };

            return resultado;
        }

        public async Task<ControlErroresDTO> CrearAsync(CrearPromocionRequestDTO promocion)
        {
            using var connection = factory.CreateOpenConnection();
            var options = new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

            var paramObject = new
            {
                p_tipo_clase_etiqueta = promocion.TipoClaseEtiqueta,
                p_json_promocion = JsonSerializer.Serialize(promocion.Promocion, options),
                p_json_acuerdos = JsonSerializer.Serialize(promocion.Acuerdos, options),
                p_json_segmentos = JsonSerializer.Serialize(promocion.Segmentos, options),
                
                p_idopcion = promocion.IdOpcion,
                p_idcontrolinterfaz = promocion.IdControlInterfaz,
                p_idevento_etiqueta = promocion.IdEventoEtiqueta,
            };

            //logger.LogInformation($"parametros a enviar para el sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);

            parameters.Add("p_idpromocion_out", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            //parameters.Add("p_resultado", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            int filasAfectadas = await connection.ExecuteAsync(
                "APL_PKG_PROMOCIONES.sp_crear_promocion",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? idPromocion = parameters.Get<int>("p_idpromocion_out");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}, idPromocion: {idPromocion}");

            //return parameters.Get<int>("p_idfondo_out");
            var retorno = new ControlErroresDTO()
            {
                Id = idPromocion,
                filasAfectadas = filasAfectadas,
                mensaje = mensajeSalida,
                codigoRetorno = codigoSalida
            };
            return retorno;
        }


    }
}
