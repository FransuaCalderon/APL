using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Catalogo;
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
    public class CatalogoRepositorio (OracleConnectionFactory factory, ILogger<CatalogoRepositorio> logger) : ICatalogoRepositorio
    {
        public async Task<IEnumerable<CatalogoDTO>> ListarAsync(
            string? nombre = null,
            int? idCatalogoTipo = null,
            int? idEstado = null,
            DateTime? creadoDesde = null,
            DateTime? creadoHasta = null,
            int pageNumber = 1,
            int pageSize = 50)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_nombre = nombre,
                p_idcatalogotipo = idCatalogoTipo,
                p_idestado = idEstado,
                p_creado_desde = creadoDesde,
                p_creado_hasta = creadoHasta,
                p_page_number = pageNumber,
                p_page_size = pageSize
            };

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("o_cur", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("o_total", OracleDbType.Int32, ParameterDirection.Output);

            var datos = await connection.QueryAsync<CatalogoDTO>(
                "APL_PKG_CATALOGO.listar",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int total = parameters.Get<int>("o_total");

            return datos;
        }

        public async Task<IEnumerable<CatalogoDTO>> FiltrarPorTipo(int idCatalogoTipo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idcatalogotipo = idCatalogoTipo
            };

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_error", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_error", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            var datos = await connection.QueryAsync<CatalogoDTO>(
                "APL_PKG_CATALOGO.SP_FILTRAR_CATALOGO_POR_TIPO",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_codigo_error");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_error");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }



        public async Task<CatalogoDTO?> ObtenerPorIdAsync(int idCatalogo)
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters(new { p_idcatalogo = idCatalogo });
            parameters.Add("o_cur", OracleDbType.RefCursor, ParameterDirection.Output);

            var datos = await connection.QueryAsync<CatalogoDTO>(
                "APL_PKG_CATALOGO.obtener_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return datos.FirstOrDefault();
        }

        public async Task<int> CrearAsync(CrearActualizarCatalogoRequest catalogo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_nombre = catalogo.Nombre,
                p_adicional = catalogo.Adicional,
                p_abreviatura = catalogo.Abreviatura,
                p_idcatalogotipo = catalogo.IdCatalogoTipo,
                p_idusuariocreacion = catalogo.IdUsuarioCreacion,
                p_idestado = catalogo.IdEstado,
                p_idetiqueta = catalogo.IdEtiqueta
            };

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("o_idcatalogo", OracleDbType.Int32, ParameterDirection.Output);

            await connection.ExecuteAsync(
                "APL_PKG_CATALOGO.crear",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return parameters.Get<int>("o_idcatalogo");
        }

        public async Task ActualizarAsync(CrearActualizarCatalogoRequest catalogo, int IdCatalogo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idcatalogo = IdCatalogo,
                p_nombre = catalogo.Nombre,
                p_adicional = catalogo.Adicional,
                p_abreviatura = catalogo.Abreviatura,
                p_idcatalogotipo = catalogo.IdCatalogoTipo,
                p_idusuariomodificacion = catalogo.IdUsuarioModificacion,
                p_idestado = catalogo.IdEstado,
                p_idetiqueta = catalogo.IdEtiqueta
            };

            var parameters = new OracleDynamicParameters(paramObject);

            await connection.ExecuteAsync(
                "APL_PKG_CATALOGO.actualizar",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }


        public async Task EliminarAsync(int idCatalogo)
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters(new { p_idcatalogo = idCatalogo });

            await connection.ExecuteAsync(
                "APL_PKG_CATALOGO.eliminar",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }


    }
}
