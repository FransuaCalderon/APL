using AppAPL.Api.Handlers;
using AppAPL.Api.Handlers.Interfaces;

namespace AppAPL.Api.Extension
{
    public static class ScopedDependenciesExtension
    {
        public static void AddInforcloudScopedDependencies(this IServiceCollection services)
        {
            services.AddScoped<IFondosEmailHandler, FondosEmailHandler>();
            services.AddScoped<IAcuerdosEmailHandler, AcuerdosEmailHandler>();
        }
    }
}
