using AppAPL.Api.Attributes;
using AppAPL.Dto.Promocion;

namespace AppAPL.Api.Handlers.Interfaces
{
    public interface IPromocionesEmailHandler
    {
        Task HandleAsync(string entidad, TipoProceso tipoProceso, string requestBody, BandModPromocionIDDTO? promocionAntiguo = null, string? responseBody = null);
    }
}
