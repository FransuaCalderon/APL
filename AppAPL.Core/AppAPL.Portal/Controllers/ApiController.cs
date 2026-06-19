using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    //[Route("api/[controller]")]
    public class ApiController : ControllerBase
    {
        // Test endpoint used by the React app to display the signed-in user
        [Authorize]
        [HttpGet("/api/me")]
        public IActionResult Me()
        {
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            return Ok(new
            {
                authenticated = User.Identity?.IsAuthenticated ?? false,
                name = User.Identity?.Name,
                claims
            });
        }

        [HttpGet("/api/ping")]
        public IActionResult Ping() => Ok(new { ok = true, ts = DateTimeOffset.UtcNow });
    }
}
