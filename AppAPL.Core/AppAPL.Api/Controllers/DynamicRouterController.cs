using AppAPL.Dto.Router;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/router-proxy")]
    public class DynamicRouterController: ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ApigeeTokenService _tokenService;
        private readonly ILogger<DynamicRouterController> _logger;

        public DynamicRouterController(
            IHttpClientFactory httpClientFactory,
            ApigeeTokenService tokenService,
            ILogger<DynamicRouterController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _tokenService = tokenService;
            _logger = logger;
        }

        [HttpPost("execute")]
        public async Task<IActionResult> Execute([FromBody] RouterRequest request)
        {
            // 1. Configurar cliente interno
            var baseUrl = $"{Request.Scheme}://{Request.Host}/";
            using var client = _httpClientFactory.CreateClient();
            client.BaseAddress = new Uri(baseUrl);

            // Reenviar el token que el front mandó (sea el real o el simulado)
            if (Request.Headers.TryGetValue("Authorization", out var authHeader))
                client.DefaultRequestHeaders.Add("Authorization", authHeader.ToString());

            // 2. Preparar el cuerpo (Body_Request)
            HttpContent? content = null;
            if (request.Body_Request.HasValue && request.Body_Request.Value.ValueKind != JsonValueKind.Null)
            {
                content = new StringContent(request.Body_Request.Value.GetRawText(), Encoding.UTF8, "application/json");
            }

            // 3. Ejecutar la llamada dinámica
            string fullPath = $"{request.Endpoint_Path}{request.Endpoint_Query_Params ?? ""}";

            var response = request.Http_Method.ToUpper() switch
            {
                "GET" => await client.GetAsync(fullPath),
                "POST" => await client.PostAsync(fullPath, content),
                //"PUT" => await client.PutAsync(fullPath, content),
                //"DELETE" => await client.DeleteAsync(fullPath),
                _ => new HttpResponseMessage(System.Net.HttpStatusCode.MethodNotAllowed)
            };

            // 4. Formatear respuesta igual al API Router
            var resString = await response.Content.ReadAsStringAsync();
            object? jsonBody;
            try { jsonBody = JsonSerializer.Deserialize<JsonElement>(resString); }
            catch { jsonBody = resString; }

            return Ok(new RouterResponse
            {
                Status = response.IsSuccessStatusCode ? "ok" : "error",
                Code_Status = (int)response.StatusCode,
                Json_Response = jsonBody,
                UniTransac = DateTime.Now.ToString("yyyyMMddHHmmssffff")
            });
        }

        /*
        // Helper para mantener la estructura de respuesta idéntica al Router
        private RouterResponse BuildRouterResponse(string status, int code, object? data)
        {
            return new RouterResponse
            {
                Status = status,
                CodeStatus = code,
                JsonResponse = data,
                UniTransac = DateTime.Now.ToString("yyyyMMddHHmmssffff")
            };
        }*/
    }
}
