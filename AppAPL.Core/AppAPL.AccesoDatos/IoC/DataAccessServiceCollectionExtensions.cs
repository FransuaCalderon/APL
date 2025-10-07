using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
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
            return services;
        }
    }
}