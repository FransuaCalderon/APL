using Microsoft.AspNetCore.Mvc;
using static Org.BouncyCastle.Math.EC.ECCurve;

[ApiController]
[Route("apigee")]
public class ApigeeController : ControllerBase
{
    private readonly ApigeeTokenService _tokenService;
    private readonly IConfiguration _config;

    public ApigeeController(ApigeeTokenService tokenService, IConfiguration config)
    {
        _tokenService = tokenService;
        _config = config;
    }
    /*
    [HttpGet("token")] // Debe ser POST porque el front lo envía así según tu config
    public async Task<IActionResult> GetToken()
    {
        // Si en el config activamos la simulación, devolvemos un token "fake"
        if (_config.GetValue<bool>("Apigee:Simulate"))
        {
            return Ok(new { access_token = "token-simulado-12345", expires_in = 3600 });
        }

        var token = await _tokenService.GetTokenAsync();
        return Ok(new { access_token = token });
    }*/
}