using AppAPL.Portal.Services;

namespace AppAPL.Portal.Extension
{
    public static class ScopedDependenciesExtension
    {

        public static void AddInforcloudScopedDependencies(this IServiceCollection services)
        {
            // Registrar tu clase cliente que usará ese HttpClient
            services.AddScoped<OpcionesApiClient>();
            services.AddScoped<CatalogoApiClient>();
            services.AddScoped<CatalogoTipoApiCliente>();
            services.AddScoped<ApigeeTokenService>();
        }
    }
}
