using AppAPL.Api.Attributes;
using AppAPL.Dto.Promocion;

namespace AppAPL.Api.Handlers.Interfaces
{
    public interface IPromocionesEmailHandler
    {
        Task HandleAsync(string entidad, TipoProceso tipoProceso, string requestBody, BandAproPromocionDTO? promocionAntiguo = null, string? responseBody = null);
    }
}
