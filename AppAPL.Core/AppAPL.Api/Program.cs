

using AppAPL.AccesoDatos.IoC;
using AppAPL.Negocio.IoC;

var builder = WebApplication.CreateBuilder(args);


// Swagger (Swashbuckle)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// IoC propios
builder.Services.AddDataAccess(builder.Configuration)
                .AddBusiness(); // <-- corrige AddBusinessLogic() por AddBusiness()


// MVC
builder.Services.AddControllers();


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

app.MapControllers();

app.Run();
