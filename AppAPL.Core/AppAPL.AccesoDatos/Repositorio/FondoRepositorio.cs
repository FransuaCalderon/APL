using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto;
using AppAPL.Dto.CatalogoTipo;
using AppAPL.Dto.Fondos;
using Dapper;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
            parameters.Add("p_cur", OracleDbType.RefCursor, ParameterDirection.Output);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<FondoDTO>(
                "APL_PKG_FONDOS.listar_fondos",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return datos;
        }

        public async Task CrearAsync(CrearFondoRequest fondo)
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
                p_nombreusuarioingreso = fondo.NombreUsuarioIngreso
            };

            var parameters = new OracleDynamicParameters(paramObject);
            //parameters.Add("p_idfondo_out", OracleDbType.Int32, ParameterDirection.Output);

            await connection.ExecuteAsync(
                "APL_PKG_FONDOS.crear_fondo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            //return parameters.Get<int>("p_idfondo_out");
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
                p_nombreusuariomodifica = fondo.NombreUsuarioModifica
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
