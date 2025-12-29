using Microsoft.AspNetCore.Mvc;
using System.Runtime.InteropServices;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController (ILogger<TestController> logger): ControllerBase
    {
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
    }
}
