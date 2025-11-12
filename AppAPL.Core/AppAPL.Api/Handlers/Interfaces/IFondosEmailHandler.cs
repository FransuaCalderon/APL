namespace AppAPL.Api.Handlers.Interfaces
{
    public interface IFondosEmailHandler
    {
        Task HandleAsync(string entidad, string tipoProceso, string idDocumento);
    }
}
