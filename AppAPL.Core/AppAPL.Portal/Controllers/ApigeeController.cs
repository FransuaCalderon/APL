using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("apigee")]
public class ApigeeController : ControllerBase
{
    private readonly ApigeeTokenService _tokenService;

    public ApigeeController(ApigeeTokenService tokenService)
    {
        _tokenService = tokenService;
    }

    [HttpGet("token")]
    public async Task<IActionResult> GetToken()
    {
        var token = await _tokenService.GetTokenAsync();

        // 🔴 CLAVE: devolver JSON
        return Ok(new
        {
            access_token = token
        });
    }
}