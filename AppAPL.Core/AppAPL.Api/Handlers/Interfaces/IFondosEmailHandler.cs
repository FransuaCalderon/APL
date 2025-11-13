using AppAPL.Api.Attributes;

namespace AppAPL.Api.Handlers.Interfaces
{
    public interface IFondosEmailHandler
    {
        Task HandleAsync(string entidad, TipoProceso tipoProceso, string bodyJson);
    }
}
