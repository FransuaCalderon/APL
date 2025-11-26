using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using Dapper;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class AcuerdoRepositorio (OracleConnectionFactory factory, ILogger<AcuerdoRepositorio> logger) : IAcuerdoRepositorio
    {
        

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

        public Task<AcuerdoDTO?> ObtenerPorIdAsync(int idAcuerdo)
        {
            throw new NotImplementedException();
        }

        public Task<ControlErroresDTO> ActualizarAsync(CrearActualizarAcuerdoDTO acuerdo, int idAcuerdo)
        {
            throw new NotImplementedException();
        }

        public Task<ControlErroresDTO> AprobarAcuerdo(AprobarAcuerdoDTO acuerdo)
        {
            throw new NotImplementedException();
        }

        public Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoDTO acuerdo)
        {
            throw new NotImplementedException();
        }

        public Task<ControlErroresDTO> InactivarAcuerdo(InactivarAcuerdoDTO acuerdo)
        {
            throw new NotImplementedException();
        }

        
    }
}
