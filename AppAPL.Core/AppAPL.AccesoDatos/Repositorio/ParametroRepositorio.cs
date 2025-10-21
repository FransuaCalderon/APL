using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Catalogo;
using AppAPL.Dto.Parametros;
using Dapper;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Repositorio
{
    public sealed class ParametroRepositorio(OracleConnectionFactory factory) : IParametroRepositorio
    {



        public async Task<IEnumerable<ParametroDTO>> ListarAsync(
            string? nombre = null,
            int? idParametroTipo = null,
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
                p_idparametrotipo = idParametroTipo,
                p_idestado = idEstado,
                p_creado_desde = creadoDesde,
                p_creado_hasta = creadoHasta,
                p_page_number = pageNumber,
                p_page_size = pageSize
            };

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("o_cur", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("o_total", OracleDbType.Int32, ParameterDirection.Output);

            var datos = await connection.QueryAsync<ParametroDTO>(
                "APL_PKG_PARAMETRO.listar",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int total = parameters.Get<int>("o_total");

            return datos;
        } 
        

        public async Task<ParametroDTO?> ObtenerPorIdAsync(int idParametro)
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters(new { p_idparametro = idParametro });
            parameters.Add("o_cur", OracleDbType.RefCursor, ParameterDirection.Output);

            var datos = await connection.QueryAsync<ParametroDTO>(
                "APL_PKG_PARAMETRO.obtener_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return datos.FirstOrDefault();
        }

        public async Task<int> CrearAsync(CrearActualizarParametroRequest parametro)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_nombre = parametro.Nombre,
                p_adicional = parametro.Adicional,
                p_abreviatura = parametro.Abreviatura,
                p_idparametrotipo = parametro.IdParametroTipo,
                p_idusuariocreacion = parametro.IdUsuarioCreacion,
                p_idestado = parametro.IdEstado,
                p_idetiqueta = parametro.IdEtiqueta
            };

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("o_idcatalogo", OracleDbType.Int32, ParameterDirection.Output);

            await connection.ExecuteAsync(
                "APL_PKG_PARAMETRO.crear",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return parameters.Get<int>("o_idcatalogo");
        }

        public async Task ActualizarAsync(CrearActualizarParametroRequest parametro, int idParametro)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idparametro = idParametro,
                p_nombre = parametro.Nombre,
                p_adicional = parametro.Adicional,
                p_abreviatura = parametro.Abreviatura,
                p_idparametrotipo = parametro.IdParametroTipo,
                p_idusuariomodificacion = parametro.IdUsuarioModificacion,
                p_idestado = parametro.IdEstado,
                p_idetiqueta = parametro.IdEtiqueta
            };

            var parameters = new OracleDynamicParameters(paramObject);

            await connection.ExecuteAsync(
                "APL_PKG_PARAMETRO.actualizar",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }


        public async Task EliminarAsync(int idParametro)
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters(new { p_idparametro = idParametro });

            await connection.ExecuteAsync(
                "APL_PKG_PARAMETRO.eliminar",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }

        
    }
}
