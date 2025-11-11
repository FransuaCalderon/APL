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
            services.AddScoped<ICatalogoTipoServicio, CatalogoTipoServicio>();
            services.AddScoped<ICatalogoServicio, CatalogoServicio>();
            services.AddScoped<IParametroTipoServicio, ParametroTipoServicio>();
            services.AddScoped<IParametroServicio, ParametroServicio>();
            services.AddScoped<IFondoServicio, FondoServicio>();
            services.AddScoped<ILogServicio, LogServicio>();
            services.AddScoped<IEmailServicio, EmailServicio>();
            services.AddScoped<IProveedorServicio, ProveedorServicio>();
            services.AddScoped<IAprobacionServicio, AprobacionServicio>();
            return services;
        }
    }
}
