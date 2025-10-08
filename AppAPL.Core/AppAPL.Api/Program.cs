

using AppAPL.AccesoDatos.IoC;
using AppAPL.Negocio.IoC;
using ExpertoAPI2.Filtros;

var builder = WebApplication.CreateBuilder(args);

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

var app = builder.Build();

// Swagger UI
app.UseSwagger();
app.UseSwaggerUI();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


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
