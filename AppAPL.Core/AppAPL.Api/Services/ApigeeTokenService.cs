public class ApigeeTokenService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    private static string _token;
    private static DateTime _expiresAt;

    public ApigeeTokenService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    public async Task<string> GetTokenAsync()
    {
        if (!string.IsNullOrEmpty(_token) && DateTime.UtcNow < _expiresAt)
            return _token;

        var client = _httpClientFactory.CreateClient();

        var request = new HttpRequestMessage(
            HttpMethod.Post,
            _config["Apigee:TokenUrl"]
        );

        var auth = Convert.ToBase64String(
            System.Text.Encoding.UTF8.GetBytes(
                $"{_config["Apigee:ClientId"]}:{_config["Apigee:ClientSecret"]}"
            )
        );

        request.Headers.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", auth);

        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials"
        });

        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var doc = System.Text.Json.JsonDocument.Parse(json);

        _token = doc.RootElement.GetProperty("access_token").GetString();
        var expiresIn = doc.RootElement.GetProperty("expires_in").GetInt32();

        _expiresAt = DateTime.UtcNow.AddSeconds(expiresIn - 60);

        return _token;
    }
}