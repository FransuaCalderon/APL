using AppAPL.Api.Attributes;
using AppAPL.Dto.Fondos;

namespace AppAPL.Api.Handlers.Interfaces
{
    public interface IFondosEmailHandler
    {
        Task HandleAsync(string entidad, TipoProceso tipoProceso, string bodyJson, FondoDTO? fondoAntiguo = null);
    }
}
