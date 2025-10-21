

using AppAPL.AccesoDatos.IoC;
using AppAPL.Negocio.IoC;
using ExpertoAPI2.Filtros;

var builder = WebApplication.CreateBuilder(args);

// ✅ Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Logging.AddLog4Net("log4net.config");

// Swagger (Swashbuckle)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// IoC propios
builder.Services.AddDataAccess(builder.Configuration)
                .AddBusiness(); // <-- corrige AddBusinessLogic() por AddBusiness()


// MVC
builder.Services.AddControllers(opciones =>
{
    opciones.Filters.Add<FiltroDeExcepcion>();
    opciones.Filters.Add<FiltroAccion>();
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




var app = builder.Build();

// Swagger UI
app.UseSwagger();
app.UseSwaggerUI();

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




app.MapControllers();

app.Run();
