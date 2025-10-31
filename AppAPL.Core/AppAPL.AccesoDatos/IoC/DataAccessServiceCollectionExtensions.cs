using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.AccesoDatos.Repositorio;
using AppAPL_AccesoDatos.Repositorio;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AppAPL.AccesoDatos.IoC
{
    public static class DataAccessServiceCollectionExtensions
    {
        public static IServiceCollection AddDataAccess(this IServiceCollection services, IConfiguration cfg)
        {
            services.AddSingleton(new OracleConfig
            {
                ConnectionString = cfg.GetConnectionString("Oracle")!
            });
            services.AddSingleton<OracleConnectionFactory>();
            services.AddScoped<IOpcionRepositorio, OpcionRepositorio>();
            services.AddScoped<ICatalogoTipoRepositorio, CatalogoTipoRepositorio>();
            services.AddScoped<ICatalogoRepositorio, CatalogoRepositorio>();
            services.AddScoped<IParametroTipoRepositorio, ParametroTipoRepositorio>();
            services.AddScoped<IParametroRepositorio, ParametroRepositorio>();
            
            services.AddScoped<IFondoRepositorio, FondoRepositorio>();
            services.AddScoped<ILogRepositorio, LogRepositorio>();
            services.AddScoped<IEmailRepositorio, EmailRepositorio>();
            return services;
        }
    }
}