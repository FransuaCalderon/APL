using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Fondos;
using Dapper;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using static System.Net.Mime.MediaTypeNames;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class AcuerdoRepositorio (OracleConnectionFactory factory, ILogger<AcuerdoRepositorio> logger) : IAcuerdoRepositorio
    {
        /*
        public async Task<IEnumerable<AcuerdoDTO>> ObtenerAcuerdosAsync()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            
            var paramObject = new
            {
                p_nombreusuario = NombreUsuario,
                p_idopcion = IdOpcion,
                p_idcontrolinterfaz = IdControlInterfaz,
                p_idevento_etiqueta = IdEvento
            };

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var parameters = new OracleDynamicParameters();  //mandar el paramObject en el constructor del parametro

            // 🔹 Agregar los parámetros de salida
            
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AcuerdoDTO>(
                "select * from APL_TB_ACUERDO",
                null,
                commandType: CommandType.Text
            );

            
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }*/

        /*
        public async Task<IEnumerable<AcuerdoFondoDTO>> ObtenerAcuerdosFondosAsync()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            
            var paramObject = new
            {
                p_nombreusuario = NombreUsuario,
                p_idopcion = IdOpcion,
                p_idcontrolinterfaz = IdControlInterfaz,
                p_idevento_etiqueta = IdEvento
            };

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            //var parameters = new OracleDynamicParameters();  //mandar el paramObject en el constructor del parametro

            // 🔹 Agregar los parámetros de salida
            
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<AcuerdoFondoDTO>(
                "select * from APL_TB_ACUERDOFONDO",
                null,
                commandType: CommandType.Text
            );

            
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }*/

        /*
        public async Task<AcuerdoDTO?> ObtenerPorIdAsync(int idAcuerdo)
        {
            using var connection = factory.CreateOpenConnection();

            //var paramObject = new { idacuerdo = idAcuerdo };
            //var parameters = new OracleDynamicParameters(paramObject);

            
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            var acuerdo = await connection.QueryFirstOrDefaultAsync<AcuerdoDTO>(
                @"select * from APL_TB_ACUERDO where idacuerdo = :idacuerdo", new { idacuerdo = idAcuerdo });

            
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return acuerdo;
        }*/

        /*
        public async Task<AcuerdoFondoDTO?> ObtenerAcuerdoFondoPorIdAsync(int idAcuerdo)
        {
            using var connection = factory.CreateOpenConnection();

            //var paramObject = new { idacuerdo = idAcuerdo };
            //var parameters = new OracleDynamicParameters(paramObject);

            
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            var acuerdo = await connection.QueryFirstOrDefaultAsync<AcuerdoFondoDTO>(
                @"select * from APL_TB_ACUERDOFONDO where idacuerdo = :idacuerdo", new { idacuerdo = idAcuerdo });

            
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");*

            return acuerdo;
        }*/

        public async Task<IEnumerable<ConsultarAcuerdoFondoDTO>> ConsultarAcuerdoFondo(int idFondo)
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<ConsultarAcuerdoFondoDTO>(
                "apl_sp_consulta_acuerdo_fondo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<FondoAcuerdoDTO>> ConsultarFondoAcuerdo()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
           
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<FondoAcuerdoDTO>(
                "APL_PKG_ACUERDOS.sp_listar_consulta_fondo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_codigo");
            string? mensajeSalida = parameters.Get<string>("p_mensaje");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }


      
        public async Task<IEnumerable<ArticuloDTO>> ConsultarArticulos(ConsultarArticuloDTO dto)
        {
            using var connection = factory.CreateOpenConnection();

            // 🎯 Lógica para determinar el valor de p_codigo
            string codigoArticuloParam = string.IsNullOrWhiteSpace(dto.CodigoArticulo)
                ? null // Si está vacío, se envía NULL
                : dto.CodigoArticulo; // De lo contrario, se envía el valor

            var paramObject = new
            {
                // 🚀 Uso de '?? Enumerable.Empty<string>()' para manejar la nulidad
                p_marcas = String.Join(",", dto.Marcas ?? Enumerable.Empty<string>()),
                p_divisiones = String.Join(",", dto.Divisiones ?? Enumerable.Empty<string>()),
                p_departamentos = String.Join(",", dto.Departamentos ?? Enumerable.Empty<string>()),
                p_clases = String.Join(",", dto.Clases ?? Enumerable.Empty<string>()),
                p_codigo = codigoArticuloParam
            };

            logger.LogInformation($"parametros antes de enviar a sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
          

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<ArticuloDTO>(
                "APL_SP_PROCESAR_SELECCION",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return datos;
        }

        public async Task<FiltrosItemsDTO> CargarCombosFiltrosItems()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Parámetros de Salida (RefCursors)
            var parameters = new OracleDynamicParameters();

            // Agregar los 4 RefCursors como parámetros de salida
            parameters.Add("p_cur_marcas", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cur_divisiones", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cur_departamentos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cur_clases", OracleDbType.RefCursor, ParameterDirection.Output);

            // 🔹 Ejecutar el SP con QueryMultiple
            using var multi = await connection.QueryMultipleAsync(
                "APL_SP_CARGAR_COMBOS_FILTROS_ITEMS",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            // 🔹 Leer cada conjunto de resultados en el ORDEN en que están definidos en el SP
            var resultado = new FiltrosItemsDTO
            {
                // 1. Marcas (p_cur_marcas)
                Marcas = await multi.ReadAsync<MarcaDTO>(),

                // 2. Divisiones (p_cur_divisiones)
                Divisiones = await multi.ReadAsync<DivisionDTO>(),

                // 3. Departamentos (p_cur_departamentos)
                Departamentos = await multi.ReadAsync<DepartamentoDTO>(),

                // 4. Clases (p_cur_clases)
                Clases = await multi.ReadAsync<ClaseDTO>()
            };

            return resultado;
        }

        public async Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoGrupoDTO acuerdo)
        {
            using var connection = factory.CreateOpenConnection();
            var options = new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

            var paramObject = new
            {
                p_tipo_clase_etiqueta = acuerdo.TipoClaseEtiqueta,
                p_json_cabecera = JsonSerializer.Serialize(acuerdo.Acuerdo, options),
                p_json_fondo = JsonSerializer.Serialize(acuerdo.Fondo, options),
                p_json_articulos = JsonSerializer.Serialize(acuerdo.Articulos, options),
                p_idopcion = acuerdo.IdOpcion,
                p_idcontrolinterfaz = acuerdo.IdControlInterfaz,
                p_idevento_etiqueta = acuerdo.IdEvento
            };

            //logger.LogInformation($"parametros a enviar para el sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);
           
            parameters.Add("p_idacuerdo_out", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            //parameters.Add("p_resultado", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            int filasAfectadas = await connection.ExecuteAsync(
                "APL_PKG_ACUERDOS.sp_crear_acuerdo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? idAcuerdo = parameters.Get<int>("p_idacuerdo_out");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}, idAcuerdo: {idAcuerdo}");

            //return parameters.Get<int>("p_idfondo_out");
            var retorno = new ControlErroresDTO()
            {
                Id = idAcuerdo,
                filasAfectadas = filasAfectadas,
                mensaje = mensajeSalida,
                codigoRetorno = codigoSalida
            };
            return retorno;
        }
        
        public async Task<IEnumerable<BandejaAprobacionAcuerdoDTO>> ConsultarBandAprobAcuerdo(string usuarioAprobador)
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new 
            {
                p_usuarioaprobador = usuarioAprobador
            };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<BandejaAprobacionAcuerdoDTO>(
                "APL_PKG_ACUERDOS.sp_consulta_bandeja_aprobacion_acuerdos",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<BandejaModificacionAcuerdoDTO>> ConsultarBandModAcuerdo()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
           
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<BandejaModificacionAcuerdoDTO>(
                "APL_PKG_ACUERDOS.sp_consulta_bandeja_modificacion",
                parameters,
                commandType: CommandType.StoredProcedure
            );


            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<BandejaInactivacionAcuerdoDTO>> ConsultarBandInacAcuerdo()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo

            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            //parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            //parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<BandejaInactivacionAcuerdoDTO>(
                "APL_PKG_ACUERDOS.sp_consulta_bandeja_inactivacion_acuerdo",
                parameters,
                commandType: CommandType.StoredProcedure
            );


            //string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            //int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            //logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<BandejaConsultaAcuerdoDTO>> ConsultarBandConsAcuerdo()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo

            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<BandejaConsultaAcuerdoDTO>(
                "APL_PKG_ACUERDOS.sp_bandeja_consulta_acuerdo",
                parameters,
                commandType: CommandType.StoredProcedure
            );


            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<BandAproAcuerdoPorIDDTO?> ObtenerBandejaAprobacionPorId(int idAcuerdo, int idAprobacion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idacuerdo = idAcuerdo,
                p_idaprobacion = idAprobacion
            };


            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_cursor_cabecera", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_articulos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_tipo_acuerdo", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);


            using var multi = await connection.QueryMultipleAsync(
                "APL_PKG_ACUERDOS.sp_consulta_bandeja_aprobacion_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
                );

            var cabecera = await multi.ReadFirstOrDefaultAsync<BandejaAprobacionAcuerdoDTO>();
            var articulos = await multi.ReadAsync<AcuerdoArticuloDTO>();

            string? tipoAcuerdo = parameters.Get<string>("p_tipo_acuerdo");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}, tipoAcuerdo: {tipoAcuerdo}");

            var resultado = new BandAproAcuerdoPorIDDTO()
            {
                cabecera = cabecera,
                articulos = articulos,
                TipoAcuerdo = tipoAcuerdo
            };

            return resultado;
        }

        public async Task<BandConsAcuerdoPorIDDTO?> ObtenerBandejaConsultaPorId(int idAcuerdo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idacuerdo = idAcuerdo
            };


            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_cursor_cabecera", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_articulos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_promociones", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_tipo_acuerdo", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);


            using var multi = await connection.QueryMultipleAsync(
                "APL_PKG_ACUERDOS.sp_bandeja_consulta_acuerdo_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
                );

            var cabecera = await multi.ReadFirstOrDefaultAsync<BandConsAcuerdoCabeceraDTO>();
            var articulos = await multi.ReadAsync<ArticuloBandConsDTO>();
            var promociones = await multi.ReadAsync<PromocionBandConsDTO>();

            string? tipoAcuerdo = parameters.Get<string>("p_tipo_acuerdo");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}, tipoAcuerdo: {tipoAcuerdo}");

            var resultado = new BandConsAcuerdoPorIDDTO()
            {
                cabecera = cabecera,
                articulos = articulos,
                promociones = promociones,
                TipoAcuerdo = tipoAcuerdo
            };

            return resultado;
        }

        public async Task<BandModAcuerdoPorIDDTO?> ObtenerBandejaModificacionPorId(int idAcuerdo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idacuerdo = idAcuerdo
            };


            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_cursor_cabecera", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_cursor_articulos", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_tipo_acuerdo", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);


            using var multi = await connection.QueryMultipleAsync(
                "APL_PKG_ACUERDOS.sp_consulta_bandeja_modificacion_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var cabecera = await multi.ReadFirstOrDefaultAsync<BandModAcuerdoCabeceraDTO>();
            var articulos = await multi.ReadAsync<ArticuloBandModDTO>();

            string? tipoAcuerdo = parameters.Get<string>("p_tipo_acuerdo");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}, tipoAcuerdo: {tipoAcuerdo}");

            var resultado = new BandModAcuerdoPorIDDTO()
            {
                cabecera = cabecera,
                articulos = articulos,
                TipoAcuerdo = tipoAcuerdo
            };

            return resultado;
        }

        public async Task<ControlErroresDTO> AprobarAcuerdo(AprobarAcuerdoRequest acuerdo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_entidad = acuerdo.Entidad,
                p_identidad = acuerdo.Identidad,
                p_idtipoproceso = acuerdo.IdTipoProceso,
                p_idetiquetatipoproceso = acuerdo.IdEtiquetaTipoProceso,
                p_comentario = acuerdo.Comentario,
                p_idetiquetaestado = acuerdo.IdEtiquetaEstado,
                p_idaprobacion = acuerdo.IdAprobacion,
                p_usuarioaprobador = acuerdo.UsuarioAprobador,

                p_idopcion = acuerdo.IdOpcion,
                p_idcontrolinterfaz = acuerdo.IdControlInterfaz,
                p_idevento_etiqueta = acuerdo.IdEvento,
                p_nombreusuario = acuerdo.NombreUsuario
            };

            logger.LogInformation($"aprobar fondo parametros sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            int filasAfectadas = await connection.ExecuteAsync(
                "APL_PKG_ACUERDOS.sp_proceso_aprobacion_acuerdo",
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

        public async Task<InactivarAcuerdoResponse> InactivarAcuerdo(InactivarAcuerdoRequest acuerdo)
        {

            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idacuerdo = acuerdo.IdAcuerdo,
                p_nombreusuarioingreso = acuerdo.NombreUsuarioIngreso,

                p_idopcion = acuerdo.IdOpcion,
                p_idcontrolinterfaz = acuerdo.IdControlInterfaz,
                p_idevento_etiqueta = acuerdo.IdEvento,
                p_nombreusuario = acuerdo.NombreUsuario
            };

            logger.LogInformation($"aprobar fondo parametros sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);

            parameters.Add("p_cursor_promociones", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            using var multi = await connection.QueryMultipleAsync(
                "APL_PKG_ACUERDOS.sp_proceso_inactivacion_acuerdo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var promociones = await multi.ReadAsync<PromocionBandConsDTO>();

            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            
            var retorno = new ControlErroresDTO()
            {
                codigoRetorno = codigoSalida,
                mensaje = mensajeSalida
            };

            var respuesta = new InactivarAcuerdoResponse
            {
                retorno = retorno,
                promociones = promociones
            };

            return respuesta;
        }
    }
}
