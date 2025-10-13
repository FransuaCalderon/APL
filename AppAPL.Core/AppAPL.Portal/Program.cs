var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}

// -----------------------------------------------------------
// A�ADIDO: Habilita el servicio de archivos est�ticos (CSS, JS, im�genes)
// -----------------------------------------------------------
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

// app.MapStaticAssets(); // Mantienes esta l�nea si es necesaria para tu setup espec�fico

app.MapControllerRoute(
    name: "default",
    // Esta ruta ya es correcta y apunta al Login/Login
    pattern: "{controller=Login}/{action=Login}/{id?}");


app.Run();