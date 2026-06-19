using AppAPL.Portal.Configuration;
using AppAPL.Portal.Extension;
using AppAPL.Portal.Services;
// ✅ AGREGAR ESTOS NAMESPACES PARA SAML:
using ITfoxtec.Identity.Saml2;
using ITfoxtec.Identity.Saml2.MvcCore;
using ITfoxtec.Identity.Saml2.MvcCore.Configuration;
using ITfoxtec.Identity.Saml2.Schemas;
using ITfoxtec.Identity.Saml2.Schemas.Metadata;
using Microsoft.AspNetCore.Authentication.Cookies;
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




// ✅ ============================================
// ✅ AGREGAR SERVICIOS SAML Y AUTH (NUEVO)
// ✅ ============================================
builder.Services.AddHttpContextAccessor(); // Requerido para leer cookies
builder.Services.AddHttpClient("apigee");  // Usado por LegadosController

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    })
    .AddCookie(options =>
    {
        options.Cookie.Name = "AppAPL.Session"; // Nombre de tu cookie
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.SlidingExpiration = true;
    });

builder.Services.Configure<Saml2Configuration>(builder.Configuration.GetSection("Saml2"));
builder.Services.Configure<Saml2Configuration>(saml2Configuration =>
{
    saml2Configuration.AllowedAudienceUris.Add(saml2Configuration.Issuer);
    saml2Configuration.CertificateValidationMode = System.ServiceModel.Security.X509CertificateValidationMode.None;

    var entityDescriptor = new EntityDescriptor();
    entityDescriptor.ReadIdPSsoDescriptorFromUrl(new Uri(builder.Configuration["Saml2:IdPMetadata"]!));

    if (entityDescriptor.IdPSsoDescriptor != null)
    {
        saml2Configuration.SingleSignOnDestination = entityDescriptor.IdPSsoDescriptor.SingleSignOnServices.First().Location;
        saml2Configuration.SingleLogoutDestination = entityDescriptor.IdPSsoDescriptor.SingleLogoutServices.First().Location;
        saml2Configuration.SignatureValidationCertificates.AddRange(entityDescriptor.IdPSsoDescriptor.SigningCertificates);
    }
    else
    {
        throw new Exception("IdPSsoDescriptor not loaded from metadata.");
    }
});

builder.Services.AddSaml2();
// ✅ FIN DE SERVICIOS SAML ========================





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


// ✅ ============================================
// ✅ AUTENTICACIÓN (NUEVO: DEBE IR AQUÍ)
// ✅ ============================================
app.UseAuthentication(); // 1. Verifica la cookie (¿Quién eres?)

app.UseAuthorization();  // 2. Verifica los permisos (¿Puedes entrar?)

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
    IConfiguration config,
    HttpContext context
    ) =>
{
    var token = await tokenService.GetTokenAsync();
    var client = clientFactory.CreateClient("ApiClient");
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    var urlUnicomer = config["ApiSettings:BaseUrl"];

    HttpContent contentToSend;

    // 1. DETECTAR EL CONTENT-TYPE
    if (context.Request.ContentType?.StartsWith("multipart/form-data") == true)
    {
        // Lógica para ARCHIVOS (la que hicimos antes)
        var multipartContent = new MultipartFormDataContent();
        var form = await context.Request.ReadFormAsync();

        foreach (var file in form.Files)
        {
            var fileStreamContent = new StreamContent(file.OpenReadStream());
            fileStreamContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);
            multipartContent.Add(fileStreamContent, file.Name, file.FileName);
        }
        foreach (var key in form.Keys)
        {
            multipartContent.Add(new StringContent(form[key].ToString() ?? string.Empty), key);
        }
        contentToSend = multipartContent;
    }
    else
    {
        using var reader = new StreamReader(context.Request.Body);
        var requestBody = await reader.ReadToEndAsync();
        contentToSend = new StringContent(requestBody ?? string.Empty, Encoding.UTF8, "application/json");
    }

    var response = await client.PostAsync(urlUnicomer, contentToSend);
    var responseData = await response.Content.ReadAsStringAsync();
    return Results.Content(responseData, "application/json", statusCode: (int)response.StatusCode);
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