using AppAPL.Portal.Configuration;
using AppAPL.Portal.Extension;
using AppAPL.Portal.Services;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ✅ Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// ✅ ============================================
// ✅ AGREGAR SESIONES (NUEVO)
// ✅ ============================================
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30); // Tiempo de expiración
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// 🔹 Vincular ApiSettings
builder.Services.Configure<ApiSettings>(
    builder.Configuration.GetSection("ApiSettings")
);

// 🔹 Registrar HttpClient global
builder.Services.AddHttpClient("ApiClient", (sp, client) =>
{
    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
    // Configurar el timeout global para todos los HttpClient
    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
    //Console.WriteLine($"Base URL: {settings.BaseUrl}");
    client.BaseAddress = new Uri(settings.BaseUrl ?? throw new InvalidOperationException("ApiSettings.BaseUrl no está configurada"));
}).ConfigurePrimaryHttpMessageHandler(serviceProvider =>
{
    // Leemos la configuración para saber si queremos saltar la validación SSL
    var settings = serviceProvider.GetRequiredService<IOptions<ApiSettings>>().Value;
    // Si SkipSslValidation está en true, deshabilitamos la validación de certificados SSL
    if (settings.DeshabilitarValidacionSSL)
    {
        return new HttpClientHandler
        {
            // Esta línea acepta cualquier certificado, sin importar errores
            ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        };
    }
    else
    {
        // Si es false, usamos el handler normal que valida certificados SSL
        return new HttpClientHandler();
    }
});

//agregamos contenedor de inyeccion de dependencias
builder.Services.AddInforcloudScopedDependencies();

// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
else
{
    app.UseDeveloperExceptionPage(); // Mejor debugging en desarrollo
}

// -----------------------------------------------------------
// Habilita el servicio de archivos estáticos (CSS, JS, imágenes)
// -----------------------------------------------------------
app.UseStaticFiles();

// ✅ ============================================
// ✅ USAR SESIÓN (DEBE IR ANTES DE UseRouting)
// ✅ ============================================
app.UseSession();

app.UseRouting();
app.UseAuthorization();

app.MapGet("/config", (IOptions<ApiSettings> options) =>
{
    var settings = options.Value;
    var configuracion = new
    {
        apiBaseUrl = settings.BaseUrl,
        settings.IdGrupo
    };
    return Results.Json(configuracion);
});

// app.MapStaticAssets(); // Mantenemos tu MapStaticAssets si es necesario para tu setup específico

app.MapControllerRoute(
    name: "default",
    // MODIFICADO: Apunta al LoginController y la acción Login
    pattern: "{controller=Login}/{action=Login}/{id?}"); // ✅ Cambié Home por Login



// Endpoint del Proxy
app.MapPost("/api/apigee-router-proxy", async (
    ApigeeTokenService tokenService,
    IHttpClientFactory clientFactory,
    IConfiguration config, // <--- Inyectamos la configuración
    HttpContext context
    ) =>
{
    try
    {
        // 1. Obtener el token
        var token = await tokenService.GetTokenAsync();
        Console.WriteLine($"token: {token}");


        // 2. Leer el cuerpo de la petición (payload del JS)
        using var reader = new StreamReader(context.Request.Body);
        var requestBody = await reader.ReadToEndAsync();

        //Console.WriteLine($"requestBody: {requestBody}");

        // 3. Configurar el cliente HTTP
        var client = clientFactory.CreateClient("ApiClient");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // 4. Leer la URL desde appsettings.json
        var urlUnicomer = config["ApiSettings:BaseUrl"];
        Console.WriteLine($"urlUnicomer: {urlUnicomer}");
        var content = new StringContent(requestBody, Encoding.UTF8, "application/json");

        // 5. Llamar a Unicomer usando la URL de la configuración
        var response = await client.PostAsync(urlUnicomer, content);
        Console.WriteLine($"response: {response}");
        // 6. Retornar respuesta al navegador
        var responseData = await response.Content.ReadAsStringAsync();
        return Results.Content(responseData, "application/json", statusCode: (int)response.StatusCode);
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = "Error en el servidor proxy", message = ex.Message }, statusCode: 500);
    }
});

// Endpoint para simular u obtener el token de Apigee
app.MapPost("/api/Apigee/token", async (
    ApigeeTokenService tokenService,
    IConfiguration config) =>
{
    // Si la configuración dice que simulemos, devolvemos el JSON directamente
    if (config.GetValue<bool>("Apigee:Simulate"))
    {
        return Results.Ok(new
        {
            access_token = "token-simulado-2026",
            expires_in = 3600
        });
    }

    // Si no es simulación, usamos el servicio real
    try
    {
        var token = await tokenService.GetTokenAsync();
        return Results.Ok(new { access_token = token });
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = "Auth Error", message = ex.Message }, statusCode: 500);
    }
});

app.Run();