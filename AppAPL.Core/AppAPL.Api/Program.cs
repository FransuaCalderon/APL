

using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.IoC;
using AppAPL.AccesoDatos.Repositorio;
using AppAPL.Api.Extension;
using AppAPL.Api.Filtros;
using AppAPL.Api.Middlewares;
using AppAPL.Api.Utilidades;
using AppAPL.Negocio.Abstracciones;
using AppAPL.Negocio.IoC;
using AppAPL.Negocio.Servicios;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ✅ Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Logging.AddLog4Net("log4net.config");

var swaggerEnabled = builder.Configuration.GetValue<bool>("SwaggerSettings:Enabled");


if (swaggerEnabled)
{
    // Swagger (Swashbuckle)
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "API AppAPL",
            Version = "v1"
        });

        c.EnableAnnotations();
    });
}




// IoC propios
builder.Services.AddDataAccess(builder.Configuration)
                .AddBusiness(); // <-- corrige AddBusinessLogic() por AddBusiness()

//agregamos contenedor de inyeccion de dependencias
builder.Services.AddInforcloudScopedDependencies();

bool UsarFormatoRespuestaGlobal = builder.Configuration.GetValue<bool>("RouterConfig:UsarFormatoGlobal");
// MVC
builder.Services.AddControllers(opciones =>
{
    opciones.Filters.Add<FiltroDeExcepcion>();
    opciones.Filters.Add<FiltroAccion>();


    if (UsarFormatoRespuestaGlobal)
    {
        opciones.Filters.Add<FormatoRouterFilter>();
    }
    //opciones.Filters.Add<EmailActionFilter>();
}).AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = new CustomSnakeCaseNamingPolicy();

});


//builder.Services.AddTransient<FiltroDeExcepcion>();
//builder.Services.AddTransient<FiltroAccion>();




// Cargar la configuración de CORS desde appsettings.json
var corsSettings = builder.Configuration.GetSection("CorsSettings");
bool allowAllOrigins = corsSettings.GetValue<bool>("AllowAllOrigins");

// Cambiar a List<string>
var allowedOrigins = corsSettings.GetSection("AllowedOrigins").Get<List<string>>() ?? new List<string>();

// Configurar servicios
builder.Services.AddCors(options =>
{
    options.AddPolicy("MyCorsPolicy", builder =>
    {
        if (allowAllOrigins)
        {
            builder.AllowAnyOrigin()
                   .AllowAnyHeader()
                   .AllowAnyMethod();
        }
        else if (allowedOrigins.Count > 0)
        {
            builder.WithOrigins(allowedOrigins.ToArray()) // Convertir a array para la política
                   .AllowAnyHeader()
                   .AllowAnyMethod();
        }
    });
});



//habilitar middleware por archivo appsetting.sjon
//var enableAuditoria = builder.Configuration.GetValue<bool>("MiddlewareSettings:EnableAuditoria");

var enableCleanJson = builder.Configuration.GetValue<bool>("MiddlewareSettings:EnableCleanJson");
var enableAuditoria = builder.Configuration.GetValue<bool>("MiddlewareSettings:EnableAuditoria");
var enableEmail = builder.Configuration.GetValue<bool>("MiddlewareSettings:EnableEmail");



//builder.Services.AddScoped<ILogServicio, LogServicio>();
//builder.Services.AddScoped<ILogRepositorio, LogRepositorio>();

var app = builder.Build();



if (swaggerEnabled)
{
    // Swagger UI
    app.UseSwagger();
    app.UseSwaggerUI();
}




// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


// Usar CORS
app.UseCors("MyCorsPolicy");

app.UseAuthorization();


// Log cuando inicia y cierra la API
var logger = app.Services.GetRequiredService<ILogger<Program>>();
var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();

lifetime.ApplicationStopping.Register(() =>
{
    logger.LogInformation("------------------ FINALIZANDO API ----------------------");
});

logger.LogInformation("------------------ INICIANDO API ----------------------");

/*
if (enableAuditoria)
{
    app.UseMiddleware<AuditoriaMiddleware>();
}*/

if (enableCleanJson)
{
    app.UseMiddleware<CleanJsonMiddleware>();
}

if (enableAuditoria)
{
    app.UseMiddleware<AuditoriaMiddleware>();
}

if (enableEmail)
{
    app.UseMiddleware<EmailMiddleware>();
}


app.MapControllers();

app.Run();
