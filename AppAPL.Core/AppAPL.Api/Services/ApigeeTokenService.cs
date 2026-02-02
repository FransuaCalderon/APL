using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

public class ApigeeTokenService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<ApigeeTokenService> logger;
    private static string _token;
    private static DateTime _expiresAt;

    public ApigeeTokenService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config, ILogger<ApigeeTokenService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        this.logger = logger;
    }

    public async Task<string> GetTokenAsync()
    {
        // 1. Validar si ya tenemos un token válido en caché
        if (!string.IsNullOrEmpty(_token) && DateTime.UtcNow < _expiresAt)
        {
            logger.LogInformation("--> [Apigee] Usando token de caché (Aún vigente)");
            return _token;
        }

        logger.LogInformation("--> [Apigee] Token expirado o inexistente. Solicitando uno nuevo...");

        // 2. Preparar el cliente y la petición
        var client = _httpClientFactory.CreateClient();

        var tokenUrl = _config["Apigee:TokenUrl"];
        var clientId = _config["Apigee:ClientId"];
        var clientSecret = _config["Apigee:ClientSecret"];

        var request = new HttpRequestMessage(HttpMethod.Post, tokenUrl);

        // 3. Configurar Auth Básica (ClientId:ClientSecret en Base64)
        var authBytes = Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}");
        var authHeader = Convert.ToBase64String(authBytes);
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

        // 4. Configurar el cuerpo de la petición
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials"
        });

        // 5. Enviar y procesar respuesta
        var response = await client.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var errorDetails = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Error obteniendo token de Apigee: {response.StatusCode}. Detalle: {errorDetails}");
        }

        var jsonResponse = await response.Content.ReadAsStringAsync();

        // 6. Deserializar usando opciones flexibles para el tipo de dato de expires_in
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var authData = JsonSerializer.Deserialize<ApigeeAuthResponse>(jsonResponse, options);

        if (authData == null || string.IsNullOrEmpty(authData.AccessToken))
        {
            throw new Exception("La respuesta de Apigee no contiene un access_token válido.");
        }

        // 7. Guardar en caché (restamos 60 segundos por seguridad/latencia)
        _token = authData.AccessToken;
        _expiresAt = DateTime.UtcNow.AddSeconds(authData.ExpiresIn - 60);

        return _token;
    }

    /// <summary>
    /// Clase interna para mapear la respuesta de Apigee
    /// </summary>
    private class ApigeeAuthResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("expires_in")]
        // Este atributo permite leer el número incluso si viene como "3600" (string)
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public int ExpiresIn { get; set; }
    }
}