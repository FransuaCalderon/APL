using AppAPL.Api.Attributes;
using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using System.Runtime.InteropServices;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [SinFormatoRouter]
    public class TestController (ILogger<TestController> logger, IConfiguration configuration) : ControllerBase
    {
        private readonly string connectionString = configuration.GetConnectionString("Oracle")!;

        [HttpGet("getstatus")]
        public async Task<ActionResult> getStatus()
        {
            var info = new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Server = Environment.MachineName,
                OS = RuntimeInformation.OSDescription,
                Runtime = RuntimeInformation.FrameworkDescription
            };

            return Ok(info);
        }

        [HttpGet("ping")]
        public async Task<ActionResult> Ping()
        {
            return Ok("pong");
        }


        [HttpGet("check-connection-bd")]
        public async Task<ActionResult> CheckConnection()
        {
            // Usamos el 'await' para liberar el hilo mientras Oracle responde
            using (var connection = new OracleConnection(connectionString))
            {
                await connection.OpenAsync();

                // Consulta liviana a DUAL para validar salud de la instancia
                using (var command = new OracleCommand("SELECT 'Conexión Exitosa' FROM DUAL", connection))
                {
                    var result = await command.ExecuteScalarAsync();

                    return Ok(new
                    {
                        status = "Success",
                        message = result?.ToString(),
                        timestamp = DateTime.Now
                    });
                }
            }
        }
    }
}
