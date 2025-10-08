using apiOracle.DTOs;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
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
    public sealed class CatalogoTipoRepositorio (OracleConnectionFactory factory) : ICatalogoTipoRepositorio
    {
        public async Task<int> InsertarCatalogoTipoAsync(CatalogoTipoDTO catalogoTipoDTO)
        {
            using var connection = factory.CreateOpenConnection();
            var parametros = new OracleDynamicParameters(new
            {
                p_Nombre = catalogoTipoDTO.Nombre,
                p_Descripcion = catalogoTipoDTO.Descripcion,
                p_IdUsuarioCreacion = catalogoTipoDTO.IdUsuarioCreacion,
                p_FechaCreacion = catalogoTipoDTO.FechaCreacion,
                p_IdUsuarioModificacion = catalogoTipoDTO.IdUsuarioModificacion,
                p_FechaModificacion = catalogoTipoDTO.FechaModificacion,
                p_IdEstado = catalogoTipoDTO.IdEstado,
                p_IdMarcaAbreviaturaAutomatica = catalogoTipoDTO.IdMarcaAbreviaturaAutomatica,
                p_IdEtiqueta = catalogoTipoDTO.IdEtiqueta
            });

            // Agregamos el parámetro OUT
            parametros.Add("p_IdCatalogoTipo", dbType: DbType.Int32, direction: ParameterDirection.Output);


            await connection.ExecuteAsync(
                "Insertar_Apl_Tb_CatalogoTipo",
                parametros,
                commandType: CommandType.StoredProcedure
            );

            // Recuperamos el ID generado
            int idGenerado = parametros.Get<int>("p_IdCatalogoTipo");


            return idGenerado;
        }

        // 🔹 Obtener todos
        public async Task<IEnumerable<CatalogoTipoDTO>> ObtenerCatalogosTipoAsync()
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters();
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);

            var result = await connection.QueryAsync<CatalogoTipoDTO>(
                "sp_obtener_catalogotipos",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result;
        }

        // 🔹 Obtener por ID
        public async Task<CatalogoTipoDTO?> ObtenerCatalogoTipoPorIdAsync(int id)
        {
            using var connection = factory.CreateOpenConnection();
            var p = new OracleDynamicParameters(new { p_IdCatalogoTipo = id });
            p.Add("p_cursor", OracleDbType.RefCursor, direction: ParameterDirection.Output);

            return await connection.QueryFirstOrDefaultAsync<CatalogoTipoDTO>(
                "sp_obtener_catalogotipo_por_id",
                p,
                commandType: CommandType.StoredProcedure
            );
        }

        // 🔹 Actualizar
        public async Task<int> ActualizarCatalogoTipoAsync(CatalogoTipoDTO dto)
        {
            using var connection = factory.CreateOpenConnection();

            var parametros = new
            {
                p_IdCatalogoTipo = dto.IdCatalogoTipo,
                p_Nombre = dto.Nombre,
                p_Descripcion = dto.Descripcion,
                p_IdUsuarioModificacion = dto.IdUsuarioModificacion,
                p_FechaModificacion = dto.FechaModificacion,
                p_IdEstado = dto.IdEstado,
                p_IdMarcaAbreviaturaAutomatica = dto.IdMarcaAbreviaturaAutomatica,
                p_IdEtiqueta = dto.IdEtiqueta
            };

            return await connection.ExecuteAsync(
                "sp_actualizar_catalogotipo",
                parametros,
                commandType: CommandType.StoredProcedure
            );
        }

        // 🔹 Eliminar
        public async Task<int> EliminarCatalogoTipoAsync(int id)
        {
            using var connection = factory.CreateOpenConnection();
            var parametros = new { p_IdCatalogoTipo = id };

            return await connection.ExecuteAsync(
                "sp_eliminar_catalogotipo",
                parametros,
                commandType: CommandType.StoredProcedure
            );
        }
    }
}
