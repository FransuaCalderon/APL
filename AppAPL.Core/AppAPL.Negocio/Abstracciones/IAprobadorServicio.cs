using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AppAPL.Dto.Aprobador;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IAprobadorServicio
    {
        Task<IEnumerable<AprobadorDTO>> ListarAsync();
        Task<AprobadorDTO?> ObtenerPorIdAsync(long idAprobador);
        Task<long> CrearAsync(CrearAprobadorRequest aprobador);
        Task ActualizarAsync(ActualizarAprobadorRequest aprobador);
        Task EliminarAsync(EliminarAprobadorRequest aprobador);
    }
}