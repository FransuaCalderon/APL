using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace AppAPL.Portal.Controllers
{
    [ApiController]
    public class LegadosController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;
        private readonly ApigeeTokenService tokenService;
        private readonly ILogger<LegadosController> logger;

        public LegadosController(IHttpClientFactory httpClientFactory, IConfiguration config, ApigeeTokenService tokenService, ILogger<LegadosController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
            this.tokenService = tokenService;
            this.logger = logger;
        }

        [HttpGet("/api/mi-ip")]
        public async Task<ActionResult> ObtenerIpCliente()
        {
            string ipCliente = ObtenerIpReal();

            // Retornamos un objeto JSON limpio para el front
            return Ok(new { ip = ipCliente });
        }

        private string ObtenerIpReal()
        {
            // 1. Si usas Cloudflare, este encabezado siempre tiene la IP real del cliente
            if (Request.Headers.TryGetValue("CF-Connecting-IP", out var cloudflareIp))
            {
                return cloudflareIp.ToString();
            }

            // 2. Si estás detrás de Nginx, IIS, Docker o un balanceador de carga estándar
            if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
            {
                // X-Forwarded-For puede devolver una lista separada por comas: "ip_cliente, ip_proxy1, ip_proxy2"
                // La primera siempre es la del cliente original
                var ipList = forwardedFor.ToString().Split(',');
                if (ipList.Length > 0 && !string.IsNullOrWhiteSpace(ipList[0]))
                {
                    return ipList[0].Trim();
                }
            }

            // 3. Conexión directa (Desarrollo local sin proxy o conexión expuesta directamente)
            var remoteIp = HttpContext.Connection.RemoteIpAddress;

            if (remoteIp != null)
            {
                // Si la IP viene en formato IPv4 mapeado a IPv6 (ej. ::ffff:192.168.1.1), la limpiamos a IPv4
                if (remoteIp.IsIPv4MappedToIPv6)
                {
                    remoteIp = remoteIp.MapToIPv4();
                }
                return remoteIp.ToString();
            }

            return "IP no disponible";
        }



        // PASO 1: Captura el email del usuario logueado (claim SAML) y consulta el
        // sistema legado (ConsultarUsuarioXEmail). Devuelve la LISTA de usuarios (Columns)
        // para poblar el combo (un email puede tener varios usuarios).
        [Authorize]
        [HttpGet("/api/consultar-usuario")]
        public async Task<IActionResult> ConsultarUsuario(CancellationToken cancellationToken)
        {
            var email = GetEmailClaim();
            //var email = "dahe@outlook.com";
            logger.LogInformation($"email obtenido: {email}");


            if (string.IsNullOrWhiteSpace(email))
            {
                logger.LogError("No se encontró el claim de email del usuario.");
                return BadRequest(new { error = "No se encontró el claim de email del usuario." });
            }

            var (status, body) = await CallApigeeAsync(
                _config["Apigee:EndpointPathConsultarUsuario"] ?? "ConsultarUsuarioXEmail",
                new Dictionary<string, object?> { ["mail"] = email },
                cancellationToken);

            if (status != System.Net.HttpStatusCode.OK || string.IsNullOrWhiteSpace(body))
            {
                logger.LogError($"Error al llamar al servicio legado (HTTP {(int)status}).");
                return StatusCode((int)status, new { error = $"Error al llamar al servicio legado (HTTP {(int)status}).", raw = body });
            }

            var columns = ExtractAllColumns(body);


            if (columns is null || columns.Count == 0)
            {
                logger.LogError("No se encontró un usuario para el email indicado.");
                //return NotFound(new { error = "No se encontró un usuario para el email indicado.", raw = body });
            }

            return Ok(columns);
        }

        // PASO 2: Recibe el CodigoUsuario (uslogin) obtenido en el paso 1 y el password
        // en texto plano; lo hashea (MD5 minúsculas) y valida contra el legado
        // (ObtenerUsuario). Devuelve el objeto Columns aplanado (UsuarioID, ...).
        [Authorize]
        [HttpPost("/api/obtener-usuario")]
        public async Task<IActionResult> ObtenerUsuario(
            [FromBody] ObtenerUsuarioRequest body,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(body?.CodigoUsuario))
            {
                return BadRequest(new { error = "codigoUsuario es requerido." });
            }
            if (string.IsNullOrWhiteSpace(body?.Password))
            {
                return BadRequest(new { error = "password es requerido." });
            }

            var hashedPassword = Md5Lower(body.Password);

            var (status, responseBody) = await CallApigeeAsync(
                _config["Apigee:EndpointPathObtenerUsuario"] ?? "ObtenerUsuario",
                new Dictionary<string, object?>
                {
                    ["uslogin"] = body.CodigoUsuario,
                    ["uspasswd"] = hashedPassword
                },
                cancellationToken);

            return BuildColumnsResult(status, responseBody, "Usuario o contraseña inválidos.");
        }

        // PASO 3: Recibe el UsuarioID obtenido en el paso 2 y consulta los accesos/opciones
        // del usuario (Accesos). Devuelve la LISTA completa de Columns.
        [Authorize]
        [HttpPost("/api/accesos")]
        public async Task<IActionResult> Accesos(
            [FromBody] AccesosRequest body,
            CancellationToken cancellationToken)
        {
            if (body?.UsuarioId is null)
            {
                return BadRequest(new { error = "usuarioId es requerido." });
            }

            var (status, responseBody) = await CallApigeeAsync(
                _config["Apigee:EndpointPathAccesos"] ?? "Accesos",
                new Dictionary<string, object?> { ["codigo"] = body.UsuarioId },
                cancellationToken);

            if (status != System.Net.HttpStatusCode.OK || string.IsNullOrWhiteSpace(responseBody))
            {
                return StatusCode((int)status, new { error = "Error al llamar al servicio legado.", raw = responseBody });
            }

            var columns = ExtractAllColumns(responseBody);
            if (columns is null)
            {
                return NotFound(new { error = "El usuario no tiene accesos configurados." });
            }

            //HttpContext.Session.SetString("Usuario", body.UsuarioId.ToString());
            return Ok(columns);
        }

        // Llamada compartida al API router de Apigee. Devuelve el status HTTP y el body crudo.
        private async Task<(System.Net.HttpStatusCode Status, string Body)> CallApigeeAsync(
            string endpointPath,
            Dictionary<string, object?> parameters,
            CancellationToken cancellationToken)
        {
            var payload = new
            {
                code_app = _config["Apigee:CodeApp"],
                http_method = _config["Apigee:HttpMethod"],
                endpoint_path = endpointPath,
                client = _config["Apigee:Client"],
                body_request = new { parameters }
            };

            var json = JsonSerializer.Serialize(payload);

            string? token = null;

            if (_config.GetValue<bool>("Apigee:Simulate"))
            {
                token = await tokenService.GetTokenRealAsync();
                logger.LogInformation("simulacion activada de token");
            }
            else
            {
                token = await tokenService.GetTokenAsync();
                logger.LogInformation("simulacion desactivada de token");
            }
                

            var client = _httpClientFactory.CreateClient("apigee");

            //logger.LogInformation($"token obtenido: {token}");


            using var request = new HttpRequestMessage(HttpMethod.Post, _config["Apigee:Url"])
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            /*
            var authHeader = _config["Apigee:AuthorizationHeader"];
            if (!string.IsNullOrWhiteSpace(authHeader))
            {
                request.Headers.TryAddWithoutValidation("Authorization", authHeader);
            }*/

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await client.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            return (response.StatusCode, responseBody);
        }

        // Devuelve únicamente json_response.Data[0].Columns (primer registro).
        private IActionResult BuildColumnsResult(System.Net.HttpStatusCode status, string body, string notFoundMessage)
        {
            if (status != System.Net.HttpStatusCode.OK || string.IsNullOrWhiteSpace(body))
            {
                return StatusCode((int)status, new { error = $"Error al llamar al servicio legado (HTTP {(int)status}).", raw = body });
            }

            var columns = ExtractFirstColumns(body);
            if (columns is null)
            {
                return NotFound(new { error = notFoundMessage, raw = body });
            }

            return new ContentResult
            {
                StatusCode = 200,
                ContentType = "application/json",
                Content = columns.Value.GetRawText()
            };
        }

        // Navega json_response.Data[0].Columns y lo devuelve clonado.
        private static JsonElement? ExtractFirstColumns(string body)
        {
            var all = ExtractAllColumns(body);
            return all is { Count: > 0 } ? all[0] : null;
        }

        // Navega json_response.Data[] y devuelve todos los Columns clonados.
        private static List<JsonElement>? ExtractAllColumns(string body)
        {
            try
            {
                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;

                if (root.TryGetProperty("json_response", out var jr) &&
                    jr.TryGetProperty("Data", out var data) &&
                    data.ValueKind == JsonValueKind.Array)
                {
                    var list = new List<JsonElement>();
                    foreach (var item in data.EnumerateArray())
                    {
                        if (item.TryGetProperty("Columns", out var columns))
                        {
                            list.Add(columns.Clone());
                        }
                    }
                    return list;
                }
            }
            catch (JsonException)
            {
                // body no es JSON válido; el caller responde como no encontrado.
            }

            return null;
        }

        // Email del usuario autenticado (claim SAML).
        private string? GetEmailClaim()
            => User.FindFirst(ClaimTypes.Email)?.Value
               ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;

        // MD5 en hex minúsculas, formato del sistema legado.
        private static string Md5Lower(string input)
        {
            var bytes = MD5.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        public class ObtenerUsuarioRequest
        {
            public string? CodigoUsuario { get; set; }
            public string? Password { get; set; }
        }

        public class AccesosRequest
        {
            public long? UsuarioId { get; set; }
        }


    }
}
