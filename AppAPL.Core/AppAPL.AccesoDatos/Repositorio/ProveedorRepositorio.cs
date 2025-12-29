using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.CatalogoTipo;
using AppAPL.Dto.Fondos;
using AppAPL.Dto.Proveedor;
using Dapper;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class ProveedorRepositorio(OracleConnectionFactory factory, ILogger<ProveedorRepositorio> logger) : IProveedorRepositorio
    {
        public async Task<IEnumerable<ProveedorDTO>> ListarAsync(string? etiqueta = "")
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new { p_etiqueta = etiqueta };
            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<ProveedorDTO>(
                "APL_SP_ListarArtefactaProveedores",
                parameters,
                commandType: CommandType.StoredProcedure
            );
            return datos;

        }


        public async Task<ProveedorDTO?> ObtenerPorIdAsync(string identificacion)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new { p_identificacion = identificacion };
            var parameters = new OracleDynamicParameters(paramObject);


            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);

            var datos = await connection.QueryAsync<ProveedorDTO>(
                "APL_SP_ListarArtefactaProveedores_por_identificacion",
                parameters,
                commandType: CommandType.StoredProcedure
                );

            return datos.FirstOrDefault();
        }
    }
}
