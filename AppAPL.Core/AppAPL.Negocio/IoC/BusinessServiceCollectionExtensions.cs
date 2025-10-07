using AppAPL.Negocio.Abstracciones;
using AppAPL.Negocio.Servicios;
using Microsoft.Extensions.DependencyInjection;

namespace AppAPL.Negocio.IoC
{
    public static class BusinessServiceCollectionExtensions
    {
        public static IServiceCollection AddBusiness(this IServiceCollection services)
        {
            services.AddScoped<IOpcionServicio, OpcionServicio>();
            return services;
        }
    }
}
