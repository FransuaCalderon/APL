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
// AÑADIDO: Habilita el servicio de archivos estáticos (CSS, JS, imágenes)
// -----------------------------------------------------------
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

// app.MapStaticAssets(); // Mantienes esta línea si es necesaria para tu setup específico

app.MapControllerRoute(
    name: "default",
    // Esta ruta ya es correcta y apunta al Login/Login
    pattern: "{controller=Login}/{action=Login}/{id?}");


app.Run();