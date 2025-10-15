using AppAPL.Portal.Configuration;
using AppAPL.Portal.Extension;
using AppAPL.Portal.Services;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

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

// -----------------------------------------------------------
// Habilita el servicio de archivos estáticos (CSS, JS, imágenes)
// -----------------------------------------------------------
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();



app.MapGet("/config", (IConfiguration config) =>
{
    var apiBaseUrl = config["ApiSettings:BaseUrl"];
    return Results.Json(new { apiBaseUrl });
});

// app.MapStaticAssets(); // Mantenemos tu MapStaticAssets si es necesario para tu setup específico

app.MapControllerRoute(
    name: "default",
    // MODIFICADO: Apunta al LoginController y la acción Login
    pattern: "{controller=Home}/{action=Index}/{id?}"); // <-- CAMBIO APLICADO AQUÍ




app.Run();
