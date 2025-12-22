using AppAPL.Api.Attributes;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Fondos;

namespace AppAPL.Api.Handlers.Interfaces
{
    public interface IAcuerdosEmailHandler
    {
        Task HandleAsync(string entidad, TipoProceso tipoProceso, string requestBody, BandConsAcuerdoPorIDDTO? acuerdoAntiguo = null, string? responseBody = null);
    }
}
