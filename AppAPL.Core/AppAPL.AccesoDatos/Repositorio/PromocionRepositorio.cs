using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Opciones;
using AppAPL.Dto.Promocion;
using Dapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using Org.BouncyCastle.Asn1.Ocsp;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using static Org.BouncyCastle.Math.EC.ECCurve;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class PromocionRepositorio (OracleConnectionFactory factory, ILogger<PromocionRepositorio> logger, IWebHostEnvironment env,
        IConfiguration configuration) : IPromocionRepositorio
    {
        public async Task<IEnumerable<PromocionDTO>> ConsultarPromocion()
        {
            using var connection = factory.CreateOpenConnection();

            
            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<PromocionDTO>(
                "APL_PKG_PROMOCIONES.sp_bandeja_consulta_promocion",
                null, //aqui van los parametros
                commandType: CommandType.StoredProcedure
            );


            
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            

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

        public async Task<IEnumerable<AcuerdoPromoDTO>> ConsultarAcuerdo(string tipoFondo, string claseAcuerdo)
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new
            {
                p_etiqueta_tipo_fondo = tipoFondo,
                p_etiqueta_clase_acuerdo = claseAcuerdo
            };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            
            parameters.Add("p_codigo", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            
            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AcuerdoPromoDTO>(
                "APL_PKG_PROMOCIONES.sp_consulta_acuerdo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            
            string? mensajeSalida = parameters.Get<string>("p_mensaje");
            int? codigoSalida = parameters.Get<int>("p_codigo");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            
            return datos;
        }

        public async Task<IEnumerable<PromocionDTO>> ConsultarBandGeneral()
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);


            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<PromocionDTO>(
                "APL_PKG_PROMOCIONES.sp_bandeja_consulta_promocion",
                parameters, //aqui van los parametros
                commandType: CommandType.StoredProcedure
            );


            
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            

            return datos;

        }

        public async Task<IEnumerable<BandInacPromocionDTO>> ConsultarBandInacPromocion()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo

            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_resp", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_resp", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<BandInacPromocionDTO>(
                "APL_PKG_PROMOCIONES.sp_bandeja_inactivacion",
                parameters,
                commandType: CommandType.StoredProcedure
            );


            string? mensajeSalida = parameters.Get<string>("p_mensaje_resp");
            int? codigoSalida = parameters.Get<int>("p_codigo_resp");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<BandModPromocionDTO>> ConsultarBandModPromocion()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo

            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<BandModPromocionDTO>(
                "APL_PKG_PROMOCIONES.sp_consulta_bandeja_modificacion",
                parameters,
                commandType: CommandType.StoredProcedure
            );


            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<BandAproPromocionDTO>> ConsultarBandAprobPromocion(string usuarioAprobador)
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new
            {
                p_usuario = usuarioAprobador
            };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            
            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<BandAproPromocionDTO>(
                "APL_PKG_PROMOCIONES.sp_bandeja_aprobacion",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");
            
            return datos;
        }

        public async Task<BandInacPromocionIDDTO?> ObtenerBandInacPromoPorId(int idPromocion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idpromocion = idPromocion
            };


            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_cursor_cabecera", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_segmentos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_acuerdos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_tipo_promocion", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);


            using var multi = await connection.QueryMultipleAsync(
                "APL_PKG_PROMOCIONES.sp_bandeja_inactivacion_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
                );

            var cabecera = await multi.ReadFirstOrDefaultAsync<CabeceraBandInacPromoDTO>();
            var segmentos = await multi.ReadAsync<SegmentoBandejaDTO>();
            var acuerdos = await multi.ReadAsync<AcuerdoBandAproDTO>();


            string? tipoPromocion = parameters.Get<string>("p_tipo_promocion");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}, tipoPromocion: {tipoPromocion}");

            var resultado = new BandInacPromocionIDDTO()
            {
                cabecera = cabecera,
                segmentos = segmentos.ToList(),
                acuerdos = acuerdos.ToList(),
                tipopromocion = tipoPromocion,
                codigoSalida = codigoSalida,
                mensajeSalida = mensajeSalida
            };

            return resultado;
        }

        public async Task<BandAproPromocionIDDTO?> ObtenerBandAproPromoPorId(int idPromocion, int idAprobacion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idpromocion = idPromocion,
                p_idaprobacion = idAprobacion
            };


            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_cursor_cabecera", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_acuerdos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_articulos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_tipo_promocion", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);


            using var multi = await connection.QueryMultipleAsync(
                "APL_PKG_PROMOCIONES.sp_consulta_bandeja_aprobacion_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
                );

            var cabecera = await multi.ReadFirstOrDefaultAsync<CabeceraBandAproPromoDTO>();
            var acuerdos = await multi.ReadAsync<AcuerdoBandAproDTO>();
            var articulos = await multi.ReadAsync<ArticuloBandAproPromoDTO>();

            string? tipoPromocion = parameters.Get<string>("p_tipo_promocion");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}, tipoPromocion: {tipoPromocion}");

            var resultado = new BandAproPromocionIDDTO()
            {
                cabecera = cabecera,
                acuerdos = acuerdos.ToList(),
                articulos = articulos.ToList(),
                tipopromocion = tipoPromocion,
                codigoSalida = codigoSalida,
                mensajeSalida = mensajeSalida
            };

            return resultado;
        }


        public async Task<BandModPromocionIDDTO?> ObtenerBandModPromoPorId(int idPromocion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idpromocion = idPromocion
            };


            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_cursor_cabecera", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_segmentos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_acuerdos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_tipo_promocion", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);


            using var multi = await connection.QueryMultipleAsync(
                "APL_PKG_PROMOCIONES.sp_bandeja_modificacion_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
                );

            var cabecera = await multi.ReadFirstOrDefaultAsync<CabeceraBandAproPromoDTO>();
            var segmentos = await multi.ReadAsync<SegmentoBandejaDTO>();
            var acuerdos = await multi.ReadAsync<AcuerdoBandAproDTO>();
           

            string? tipoPromocion = parameters.Get<string>("p_tipo_promocion");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}, tipoPromocion: {tipoPromocion}");

            var resultado = new BandModPromocionIDDTO()
            {
                cabecera = cabecera,
                segmentos = segmentos.ToList(),
                acuerdos = acuerdos.ToList(),
                tipopromocion = tipoPromocion,
                codigoSalida = codigoSalida,
                mensajeSalida = mensajeSalida
            };

            return resultado;
        }

        public async Task<BandGenPromocionIDDTO?> ObtenerBandGenPromoPorId(int idPromocion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idpromocion = idPromocion
            };


            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_cursor_cabecera", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_segmentos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_acuerdos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_clase_promocion", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);


            using var multi = await connection.QueryMultipleAsync(
                "APL_PKG_PROMOCIONES.sp_consulta_promocion_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
                );

            var cabecera = await multi.ReadFirstOrDefaultAsync<CabeceraBandInacPromoDTO>();
            var segmentos = await multi.ReadAsync<SegmentoBandejaDTO>();
            var acuerdos = await multi.ReadAsync<AcuerdoBandAproDTO>();

            string? clasePromocion = parameters.Get<string>("p_clase_promocion");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}, clasePromocion: {clasePromocion}");

            var resultado = new BandGenPromocionIDDTO()
            {
                cabecera = cabecera,
                segmentos = segmentos.ToList(),
                acuerdos = acuerdos.ToList(),
                clase_promocion = clasePromocion,
                codigoSalida = codigoSalida,
                mensajeSalida = mensajeSalida
            };

            return resultado;
        }

        public async Task<ControlErroresDTO> CrearAsync(CrearPromocionRequestDTO promocion)
        {

            using var connection = factory.CreateOpenConnection();
            var options = new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

            // --- AQUÍ USAS EL MÉTODO ---
            string rutaFisicaFinal = await ProcesarArchivoBase64(promocion.ArchivoSoporteBase64, promocion.NombreArchivoSoporte);

            var paramObject = new
            {
                p_tipo_clase_etiqueta = promocion.TipoClaseEtiqueta,
                p_json_promocion = JsonSerializer.Serialize(promocion.Promocion, options),
                p_json_acuerdos = JsonSerializer.Serialize(promocion.Acuerdos, options),
                p_json_segmentos = JsonSerializer.Serialize(promocion.Segmentos, options),
                
                p_idopcion = promocion.IdOpcion,
                p_idcontrolinterfaz = promocion.IdControlInterfaz,
                p_idevento_etiqueta = promocion.IdEventoEtiqueta,
                p_archivosoporte = rutaFisicaFinal
            };

            logger.LogInformation($"parametros a enviar para el sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);

            parameters.Add("p_idpromocion_out", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            //parameters.Add("p_resultado", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            //int filasAfectadas = 1;
            
            int filasAfectadas = await connection.ExecuteAsync(
                "APL_PKG_PROMOCIONES.sp_crear_promocion",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? idPromocion = parameters.Get<int>("p_idpromocion_out");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}, idPromocion: {idPromocion}");

            
            // 4. Si Oracle dice que hubo error, borramos el archivo físico (Rollback manual)
            if (codigoSalida == 0 && !string.IsNullOrEmpty(rutaFisicaFinal))
            {
                if (File.Exists(rutaFisicaFinal)) File.Delete(rutaFisicaFinal);
            }

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

        public async Task<ControlErroresDTO> AprobarPromocion(AprobarPromocionRequest promocion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_entidad = promocion.Entidad,
                p_identidad = promocion.Identidad,
                p_idtipoproceso = promocion.IdTipoProceso,
                p_idetiquetatipoproceso = promocion.IdEtiquetaTipoProceso,
                p_comentario = promocion.Comentario,
                p_idetiquetaestado = promocion.IdEtiquetaEstado,
                p_idaprobacion = promocion.IdAprobacion,
                p_usuarioaprobador = promocion.UsuarioAprobador,

                p_idopcion = promocion.IdOpcion,
                p_idcontrolinterfaz = promocion.IdControlInterfaz,
                p_idevento_etiqueta = promocion.IdEvento,
                p_nombreusuario = promocion.NombreUsuario
            };

            logger.LogInformation($"aprobar fondo parametros sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            int filasAfectadas = await connection.ExecuteAsync(
                "APL_PKG_PROMOCIONES.sp_proceso_aprobacion_promocion",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");


            var retorno = new ControlErroresDTO()
            {
                codigoRetorno = codigoSalida,
                mensaje = mensajeSalida,
                filasAfectadas = filasAfectadas
            };

            return retorno;
        }

        private async Task<string> ProcesarArchivoBase64(string base64String, string nombreOriginal)
        {
            if (string.IsNullOrEmpty(base64String)) return string.Empty;

            // 1. Obtener el nombre desde el JSON (o usar uno por defecto)
            string nombreCarpetaConfig = configuration.GetValue<string>("ConfiguracionArchivos:ArchivoSoportes") ?? "ArchivoSoportes";

            // 2. Construir la ruta física completa
            string folderPath = Path.Combine(env.ContentRootPath, nombreCarpetaConfig);

            // 3. ¡AQUÍ ESTÁ LA MAGIA! Si no existe, la creamos al vuelo
            if (!Directory.Exists(folderPath))
            {
                logger.LogInformation($"La carpeta {nombreCarpetaConfig} no existe. Creándola...");
                Directory.CreateDirectory(folderPath);
            }

            // 4. Limpiar el Base64 (quitar el prefijo data:image/...)
            string base64Limpio = base64String.Contains(",") ? base64String.Split(',')[1] : base64String;

            // 5. Preparar nombre único y ruta final del archivo
            string fileName = $"{Guid.NewGuid()}_{nombreOriginal}";
            string rutaCompleta = Path.Combine(folderPath, fileName);

            // 6. Guardar los bytes en el disco
            byte[] fileBytes = Convert.FromBase64String(base64Limpio);
            await File.WriteAllBytesAsync(rutaCompleta, fileBytes);

            // 7. Retornar la ruta relativa para guardar en la BD
            // Esto devolverá algo como: "SoportesSistemas/guid_nombre.jpg"
            return Path.Combine(nombreCarpetaConfig, fileName);
        }


        public async Task<ControlErroresDTO> InactivarPromocion(InactivarPromocionRequest promocion)
        {

            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idpromocion = promocion.IdPromocion,
                p_nombreusuarioingreso = promocion.NombreUsuarioIngreso,

                p_idopcion = promocion.IdOpcion,
                p_idcontrolinterfaz = promocion.IdControlInterfaz,
                p_idevento_etiqueta = promocion.IdEvento,
                p_nombreusuario = promocion.NombreUsuario
            };

            //logger.LogInformation($"inactivar acuerdo parametros sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);

            //parameters.Add("p_cursor_promociones", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            int filasAfectadas = await connection.ExecuteAsync(
                "APL_PKG_PROMOCIONES.sp_proceso_inactivacion_promocion",
                parameters,
                commandType: CommandType.StoredProcedure
            );



            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");


            var retorno = new ControlErroresDTO()
            {
                codigoRetorno = codigoSalida,
                mensaje = mensajeSalida,
                filasAfectadas = filasAfectadas
            };

            return retorno;
        }



        public async Task<ControlErroresDTO> ActualizarAsync(ActualizarPromocionRequest promocion)
        {
            using var connection = factory.CreateOpenConnection();
            var options = new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };


            // --- AQUÍ USAS EL MÉTODO ---
            string? rutaFisicaFinal = await ProcesarArchivoBase64(promocion.ArchivoSoporteBase64, promocion.NombreArchivoSoporte);

            var paramObject = new
            {
                p_idpromocion = promocion.IdPromocion,
                p_clasepromocion = promocion.ClasePromocion,
                p_json_promocion = JsonSerializer.Serialize(promocion.Promocion, options),
                p_json_acuerdos = JsonSerializer.Serialize(promocion.Acuerdos, options),
                p_json_segmentos = JsonSerializer.Serialize(promocion.Segmentos, options),
                p_archivosoporte = !string.IsNullOrEmpty(rutaFisicaFinal) ? rutaFisicaFinal : promocion.rutaArchivoAntiguo,
                p_idtipoproceso = promocion.IdTipoProceso,

                p_idopcion = promocion.IdOpcion,
                p_idcontrolinterfaz = promocion.IdControlInterfaz,
                p_idevento_etiqueta = promocion.IdEventoEtiqueta,

            };

            logger.LogInformation($"parametros antes de enviar al sp: {paramObject.ToString()}");

            //logger.LogInformation($"parametros a enviar para el sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            int filasAfectadas = await connection.ExecuteAsync(
                "APL_PKG_PROMOCIONES.sp_modificar_promocion",
                parameters,
                commandType: CommandType.StoredProcedure
            );


            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");


            if (codigoSalida == 0 && !string.IsNullOrEmpty(promocion.rutaArchivoAntiguo) && !string.IsNullOrWhiteSpace(promocion.ArchivoSoporteBase64))
            {
                // Combina la raíz del proyecto con la ruta que viene del JSON
                string rutaFisicaAntigua = Path.Combine(env.ContentRootPath, promocion.rutaArchivoAntiguo);
                logger.LogInformation($"rutaFisicaAntigua: {rutaFisicaAntigua}");

                if (File.Exists(rutaFisicaAntigua))
                {
                    File.Delete(rutaFisicaAntigua);
                }
            }



            //return parameters.Get<int>("p_idfondo_out");
            var retorno = new ControlErroresDTO()
            {
                filasAfectadas = filasAfectadas,
                mensaje = mensajeSalida,
                codigoRetorno = codigoSalida
            };
            return retorno;
        }


    }
}
