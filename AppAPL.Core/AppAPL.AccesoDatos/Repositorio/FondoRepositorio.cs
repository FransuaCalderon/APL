using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto;
using AppAPL.Dto.CatalogoTipo;
using AppAPL.Dto.Fondos;
using Dapper;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class FondoRepositorio(OracleConnectionFactory factory, ILogger<FondoRepositorio> logger) : IFondoRepositorio
    {
        public async Task<IEnumerable<FondoDTO>> ObtenerFondosAsync()
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<FondoDTO>(
                "APL_PKG_FONDOS.sp_listar_fondos",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public async Task<IEnumerable<BandejaFondoDTO>> ObtenerBandejaModificacion()
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<BandejaFondoDTO>(
                "APL_PKG_FONDOS.sp_bandeja_modificacion",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            

            return datos;
        }

        public async Task<IEnumerable<BandejaAprobacionDTO>> ObtenerBandejaAprobacion(string usuarioAprobador)
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new { p_usuarioaprobador = usuarioAprobador };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);


            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<BandejaAprobacionDTO>(
                "APL_PKG_FONDOS.sp_bandeja_consulta_aprobacion",
                parameters,
                commandType: CommandType.StoredProcedure
            );



            return datos;
        }


        public async Task<IEnumerable<BandejaFondoDTO>> ObtenerBandejaInactivacion()
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);


            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<BandejaFondoDTO>(
                "APL_PKG_FONDOS.sp_bandeja_inactivacion",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return datos;
        }

        public async Task<FondoDTO?> ObtenerPorIdAsync(int idFondo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            var datos = await connection.QueryAsync<FondoDTO>(
                "APL_PKG_FONDOS.sp_obtener_fondo_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
                );

            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos.FirstOrDefault();
        }

        public async Task<BandejaFondoDTO?> ObtenerBandejaModificacionPorId(int idFondo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            var datos = await connection.QueryAsync<BandejaFondoDTO>(
                "APL_PKG_FONDOS.sp_bandeja_modificacion_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
                );

            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos.FirstOrDefault();
        }

        public async Task<BandejaAprobacionDTO?> ObtenerBandejaAprobacionPorId(int idFondo, int idAprobacion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new 
            { 
                p_idfondo = idFondo,
                p_idaprobacion = idAprobacion
            };


            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            

            var datos = await connection.QueryAsync<BandejaAprobacionDTO>(
                "APL_PKG_FONDOS.sp_bandeja_consulta_aprobacion_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
                );


            return datos.FirstOrDefault();
        }

        public async Task<ControlErroresDTO> CrearAsync(CrearFondoRequest fondo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_descripcion = fondo.Descripcion,
                p_idproveedor = fondo.IdProveedor,
                p_idtipofondo = fondo.IdTipoFondo,
                p_valorfondo = fondo.ValorFondo,
                p_fechainiciovigencia = fondo.FechaInicioVigencia,
                p_fechafinvigencia = fondo.FechaFinVigencia,
                p_idusuarioingreso = fondo.IdUsuarioIngreso,
                p_nombreusuarioingreso = fondo.NombreUsuarioIngreso,

                p_idopcion = fondo.IdOpcion,
                p_idcontrolinterfaz = fondo.IdControlInterfaz,
                p_idevento = fondo.IdEvento
            };

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("p_idfondo", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            int filasAfectadas = await connection.ExecuteAsync(
                "APL_PKG_FONDOS.crear_fondo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? idFondo = parameters.Get<int>("p_idfondo");
            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            //return parameters.Get<int>("p_idfondo_out");
            var retorno = new ControlErroresDTO()
            {
                Id = idFondo,
                filasAfectadas = filasAfectadas,
                mensaje = mensajeSalida,
                codigoRetorno = codigoSalida
            };
            return retorno;
        }

        public async Task<ControlErroresDTO> AprobarFondo(AprobarFondoRequest fondo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_entidad = fondo.Entidad,
                p_identidad = fondo.Identidad,
                p_idtipoproceso = fondo.idTipoProceso,
                p_idetiquetatipoproceso = fondo.idEtiquetaTipoProceso,
                p_comentario = fondo.Comentario,
                p_idetiquetaestado = fondo.idEtiquetaEstado,
                p_idaprobacion = fondo.IdAprobacion,
                p_usuarioaprobador = fondo.UsuarioAprobador,

                p_idopcion = fondo.IdOpcion,
                p_idcontrolinterfaz = fondo.IdControlInterfaz,
                p_idevento = fondo.IdEvento
            };

            logger.LogInformation($"aprobar fondo parametros sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            int filasAfectadas = await connection.ExecuteAsync(
                "APL_PKG_FONDOS.sp_proceso_aprobacion_fondo",
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

        public async Task<ControlErroresDTO> ActualizarAsync(ActualizarFondoRequest fondo, int idFondo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idfondo = idFondo,
                p_descripcion = fondo.Descripcion,
                p_idproveedor = fondo.IdProveedor,
                p_idtipofondo = fondo.IdTipoFondo,
                p_valorfondo = fondo.ValorFondo,
                p_fechainiciovigencia = fondo.FechaInicioVigencia,
                p_fechafinvigencia = fondo.FechaFinVigencia,
                p_idusuariomodifica = fondo.IdUsuarioModifica,
                p_nombreusuariomodifica = fondo.NombreUsuarioModifica,

                p_idopcion = fondo.IdOpcion,
                p_idcontrolinterfaz = fondo.IdControlInterfaz,
                p_idevento = fondo.IdEvento
            };

            var parameters = new OracleDynamicParameters(paramObject);

            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            string sp = "APL_PKG_FONDOS.actualizar_fondo";

            logger.LogInformation($"parametros antes de actualizar fondos: {paramObject.ToString()}");
            logger.LogInformation($"sp a ejecutar: {sp}");


            await connection.ExecuteAsync(
                sp,
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            

            var retorno = new ControlErroresDTO()
            {
                codigoRetorno = codigoSalida,
                mensaje = mensajeSalida
            };

            return retorno;
        }

        
        public async Task EliminarAsync(int idFondo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new { p_idfondo = idFondo };
            var parameters = new OracleDynamicParameters(paramObject);

            await connection.ExecuteAsync(
                "APL_PKG_FONDOS.eliminar_fondo",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }

    }
}
