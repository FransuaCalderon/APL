using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.CatalogoTipo;
using AppAPL.Dto.Proveedor;
using Dapper;
using Oracle.ManagedDataAccess.Client;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class ProveedorRepositorio(OracleConnectionFactory factory) : IProveedorRepositorio
    {
        public async Task<IEnumerable<ProveedorDTO>> ListarAsync()
        {
            using var connection = factory.CreateOpenConnection();

            var parameters = new OracleDynamicParameters();

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
    }
}
