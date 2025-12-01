using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using Dapper;
using Microsoft.Extensions.Logging;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using static System.Net.Mime.MediaTypeNames;

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

        public async Task<IEnumerable<FondoAcuerdoDTO>> ConsultarFondoAcuerdo()
        {
            using var connection = factory.CreateOpenConnection();

            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
           
            var parameters = new OracleDynamicParameters();

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<FondoAcuerdoDTO>(
                "APL_PKG_ACUERDOS.listar_consulta_fondo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_codigo");
            string? mensajeSalida = parameters.Get<string>("p_mensaje");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }

        public Task<IEnumerable<ArticuloDTO>> ConsultarArticulos(int idMarca, int idDivision, int idDepartamento, int idClase)
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<ClaseDTO>> ConsultarClases()
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<DepartamentoDTO>> ConsultarDepartamentos()
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<DivisionDTO>> ConsultarDivisiones()
        {
            throw new NotImplementedException();
        }

        public Task<IEnumerable<MarcaDTO>> ConsultarMarcas()
        {
            throw new NotImplementedException();
        }

        public async Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoGrupoDTO acuerdo)
        {
            using var connection = factory.CreateOpenConnection();
            var options = new JsonSerializerOptions { WriteIndented = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

            var paramObject = new
            {
                p_tipo_clase_etiqueta = acuerdo.TipoClaseEtiqueta,
                p_json_cabecera = JsonSerializer.Serialize(acuerdo.Acuerdo, options),
                p_json_fondo = JsonSerializer.Serialize(acuerdo.Fondo, options),
                p_json_articulos = JsonSerializer.Serialize(acuerdo.Articulos, options)
            };

            //logger.LogInformation($"parametros a enviar para el sp: {paramObject.ToString()}");

            var parameters = new OracleDynamicParameters(paramObject);
           
            parameters.Add("p_idacuerdo_out", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_resultado", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            int filasAfectadas = await connection.ExecuteAsync(
                "APL_PKG_ACUERDOS.sp_crear_acuerdo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? idAcuerdo = parameters.Get<int>("p_idacuerdo_out");
            string? mensajeSalida = parameters.Get<string>("p_resultado");

            logger.LogInformation($"idAcuerdo: {idAcuerdo}, mensajeSalida: {mensajeSalida}");

            //return parameters.Get<int>("p_idfondo_out");
            var retorno = new ControlErroresDTO()
            {
                Id = idAcuerdo,
                filasAfectadas = filasAfectadas,
                mensaje = mensajeSalida,
                codigoRetorno = 0
            };
            return retorno;
        }

        public Task<ArticuloDTO?> ObtenerArticuloPorId(int idArticulo)
        {
            throw new NotImplementedException();
        }
    }
}
