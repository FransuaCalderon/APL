
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Catalogo;
//using Dapper.Oracle;
using AppAPL.Dto.CatalogoTipo;
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
    public sealed class CatalogoTipoRepositorio (OracleConnectionFactory factory) : ICatalogoTipoRepositorio
    {
        

        // 🔹 Obtener todos
        public async Task<IEnumerable<CatalogoTipoDTO>> ObtenerCatalogosTipoAsync(
            string? nombre = null,
            int? idEstado = null,
            DateTime? creadoDesde = null,
            DateTime? creadoHasta = null,
            int pageNumber = 1,
            int pageSize = 50)
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Crear un objeto anónimo con los parámetros de entrada
            var paramObject = new
            {
                p_nombre = nombre,
                p_idestado = idEstado,
                p_creado_desde = creadoDesde,
                p_creado_hasta = creadoHasta,
                p_page_number = pageNumber,
                p_page_size = pageSize
            };

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("o_cur", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("o_total", OracleDbType.Int32, ParameterDirection.Output);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<CatalogoTipoDTO>(
                "APL_PKG_CATALOGOTIPO.listar",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            // 🔹 Obtener el total
            int total = parameters.Get<int>("o_total");

            return datos;
        }


        // 🔹 Obtener por ID
        public async Task<CatalogoTipoDTO?> ObtenerPorIdAsync(int idCatalogoTipo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new { p_idcatalogotipo = idCatalogoTipo };
            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("o_cur", OracleDbType.RefCursor, ParameterDirection.Output);

            var datos = await connection.QueryAsync<CatalogoTipoDTO>(
                "APL_PKG_CATALOGOTIPO.obtener_por_id",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return datos.FirstOrDefault();
        }

        public async Task<int> CrearAsync(CrearActualizarCatalogoTipoRequest catalogoTipo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_nombre = catalogoTipo.Nombre,
                p_descripcion = catalogoTipo.Descripcion,
                p_idusuariocreacion = catalogoTipo.IdUsuarioCreacion,
                p_idestado = catalogoTipo.IdEstado,
                p_idmarcaabreviaturaautomatica = catalogoTipo.IdMarcaAbreviaturaAutomatica,
                p_idetiqueta = catalogoTipo.IdEtiqueta
            };

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("o_idcatalogotipo", OracleDbType.Int32, ParameterDirection.Output);

            await connection.ExecuteAsync(
                "APL_PKG_CATALOGOTIPO.crear",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return parameters.Get<int>("o_idcatalogotipo");
        }

        // 🔹 Actualizar
        public async Task ActualizarAsync(CrearActualizarCatalogoTipoRequest catalogoTipo, int idCatalogoTipo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idcatalogotipo = idCatalogoTipo,
                p_nombre = catalogoTipo.Nombre,
                p_descripcion = catalogoTipo.Descripcion,
                p_idusuariomodificacion = catalogoTipo.IdUsuarioModificacion,
                p_idestado = catalogoTipo.IdEstado,
                p_idmarcaabreviaturaautomatica = catalogoTipo.IdMarcaAbreviaturaAutomatica,
                p_idetiqueta = catalogoTipo.IdEtiqueta
            };

            var parameters = new OracleDynamicParameters(paramObject);

            await connection.ExecuteAsync(
                "APL_PKG_CATALOGOTIPO.actualizar",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }

        // 🔹 Eliminar
        public async Task EliminarAsync(int idCatalogoTipo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new { p_idcatalogotipo = idCatalogoTipo };
            var parameters = new OracleDynamicParameters(paramObject);

            await connection.ExecuteAsync(
                "APL_PKG_CATALOGOTIPO.eliminar",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }
    }
}
