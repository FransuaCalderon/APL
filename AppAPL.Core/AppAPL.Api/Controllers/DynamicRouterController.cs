using AppAPL.Dto.Router;
using Microsoft.AspNetCore.Mvc;
using MimeKit;
using System.Net.Http;
using System.Net.Http.Headers;
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
        //[Consumes("multipart/form-data", "application/json")]
        public async Task<ActionResult> Execute([FromForm] RouterExecuteRequest form)
        {
            RouterRequest? request = null;
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // 1. DETERMINAR EL ORIGEN DE LA PETICIÓN
            // Caso A: Viene como Form-Data (probablemente desde el Front con archivos)
            if (!string.IsNullOrEmpty(form.RouterRequestJson))
            {
                request = JsonSerializer.Deserialize<RouterRequest>(form.RouterRequestJson, options);
            }
            // Caso B: Viene como JSON puro en el Body (Retrocompatibilidad)
            else
            {
                Request.EnableBuffering(); // Permite leer el body múltiples veces en .NET 9
                using var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
                var body = await reader.ReadToEndAsync();
                Request.Body.Position = 0; // Reset por si otro middleware lo necesita

                if (!string.IsNullOrEmpty(body))
                {
                    request = JsonSerializer.Deserialize<RouterRequest>(body, options);
                }
            }

            if (request == null)
                return BadRequest(new { status = "error", message = "No se pudo procesar la estructura RouterRequest" });

            // 2. CONFIGURAR CLIENTE HTTP INTERNO
            var baseUrl = $"{Request.Scheme}://{Request.Host}/";
            using var client = _httpClientFactory.CreateClient();
            client.BaseAddress = new Uri(baseUrl);

            // Reenviar el token de autorización
            if (Request.Headers.TryGetValue("Authorization", out var authHeader))
                client.DefaultRequestHeaders.Authorization = AuthenticationHeaderValue.Parse(authHeader.ToString().Replace("Bearer ", ""));

            // 3. PREPARAR EL CONTENIDO PARA EL REENVÍO (PAYLOAD)
            HttpContent? contentToSend = null;

            if (form.ArchivoSoporte != null)
            {
                // REENVÍO MULTIPART (CON ARCHIVO)
                var multipart = new MultipartFormDataContent();

                // Agregar Archivo
                var fileStreamContent = new StreamContent(form.ArchivoSoporte.OpenReadStream());
                fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue(form.ArchivoSoporte.ContentType);
                multipart.Add(fileStreamContent, "ArchivoSoporte", form.ArchivoSoporte.FileName);

                // Agregar el JSON de negocio que viene en Body_Request
                if (request.Body_Request.HasValue && request.Body_Request.Value.ValueKind != JsonValueKind.Null)
                {
                    // Lo mandamos como 'promocionJson' para que coincida con tu endpoint real
                    var jsonContent = request.Body_Request.Value.GetRawText();
                    multipart.Add(new StringContent(jsonContent, Encoding.UTF8, "application/json"), "promocionJson");
                }
                contentToSend = multipart;
            }
            else if (request.Body_Request.HasValue && request.Body_Request.Value.ValueKind != JsonValueKind.Null)
            {
                // REENVÍO JSON SIMPLE
                var jsonBody = request.Body_Request.Value.GetRawText();
                contentToSend = new StringContent(jsonBody, Encoding.UTF8, "application/json");
            }

            // 4. EJECUTAR LLAMADA AL ENDPOINT FINAL
            string fullPath = $"{request.Endpoint_Path}{request.Endpoint_Query_Params ?? ""}";
            HttpResponseMessage response;

            try
            {
                response = request.Http_Method.ToUpper() switch
                {
                    "GET" => await client.GetAsync(fullPath),
                    "POST" => await client.PostAsync(fullPath, contentToSend),
                    "PUT" => await client.PutAsync(fullPath, contentToSend),
                    _ => new HttpResponseMessage(System.Net.HttpStatusCode.MethodNotAllowed)
                };
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = "error", message = $"Error interno al llamar al endpoint: {ex.Message}" });
            }

            // 5. PROCESAR Y RETORNAR RESPUESTA ESTÁNDAR
            var resString = await response.Content.ReadAsStringAsync();
            object? jsonBodyRes;
            try { jsonBodyRes = JsonSerializer.Deserialize<JsonElement>(resString); }
            catch { jsonBodyRes = resString; }

            return Ok(new RouterResponse
            {
                Status = response.IsSuccessStatusCode ? "ok" : "error",
                Code_Status = (int)response.StatusCode,
                Json_Response = jsonBodyRes,
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
