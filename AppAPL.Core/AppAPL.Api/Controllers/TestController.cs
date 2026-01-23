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
        public IActionResult CheckConnection()
        {
           
                using (var connection = new OracleConnection(connectionString))
                {
                    connection.Open();

                    // Una consulta simple que no requiere tablas del usuario
                    using (var command = new OracleCommand("SELECT 'Conexión Exitosa' FROM DUAL", connection))
                    {
                        var result = command.ExecuteScalar();
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
