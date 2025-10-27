using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.CatalogoTipo;
using AppAPL.Dto.Fondos;
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
    public class FondoRepositorio(OracleConnectionFactory factory) : IFondoRepositorio
    {
        public async Task<IEnumerable<FondoDTO>> ObtenerFondosAsync()
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cur", OracleDbType.RefCursor, ParameterDirection.Output);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<FondoDTO>(
                "APL_PKG_FONDOS.listar_fondos",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return datos;
        }

        public async Task<int> CrearAsync(CrearActualizarFondoRequest fondo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_descripcion_fondo = fondo.Descripcion_Fondo,
                p_idproveedor = fondo.IdProveedor,
                p_tipo_fondo = fondo.Tipo_Fondo,
                p_valor_fondo = fondo.Valor_Fondo,
                p_fecha_inicio_vigencia = fondo.Fecha_Inicio_Vigencia,
                p_fecha_fin_vigencia = fondo.Fecha_Fin_Vigencia,
                p_valor_disponible = fondo.Valor_Disponible,
                p_valor_comprometido = fondo.Valor_Comprometido,
                p_valor_liquidado = fondo.Valor_Liquidado,
                p_estado_registro = fondo.Estado_Registro,
                p_indicador_creacion = fondo.Indicador_Creacion
            };

            var parameters = new OracleDynamicParameters(paramObject);
            parameters.Add("p_idfondo_out", OracleDbType.Int32, ParameterDirection.Output);

            await connection.ExecuteAsync(
                "APL_PKG_FONDOS.crear_fondo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return parameters.Get<int>("p_idfondo_out");
        }

        public async Task ActualizarAsync(CrearActualizarFondoRequest fondo, int idFondo)
        {
            using var connection = factory.CreateOpenConnection();

            var paramObject = new
            {
                p_idfondo = idFondo,
                p_descripcion_fondo = fondo.Descripcion_Fondo,
                p_idproveedor = fondo.IdProveedor,
                p_tipo_fondo = fondo.Tipo_Fondo,
                p_valor_fondo = fondo.Valor_Fondo,
                p_fecha_inicio_vigencia = fondo.Fecha_Inicio_Vigencia,
                p_fecha_fin_vigencia = fondo.Fecha_Fin_Vigencia,
                p_valor_disponible = fondo.Valor_Disponible,
                p_valor_comprometido = fondo.Valor_Comprometido,
                p_valor_liquidado = fondo.Valor_Liquidado,
                p_estado_registro = fondo.Estado_Registro,
                p_indicador_creacion = fondo.Indicador_Creacion
            };

            var parameters = new OracleDynamicParameters(paramObject);
            

            await connection.ExecuteAsync(
                "APL_PKG_FONDOS.actualizar_fondo",
                parameters,
                commandType: CommandType.StoredProcedure
            );
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
