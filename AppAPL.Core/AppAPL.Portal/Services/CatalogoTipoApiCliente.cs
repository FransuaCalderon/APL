using AppAPL.Dto.Catalogo;
using AppAPL.Dto.CatalogoTipo;
using System.Net.Http;

namespace AppAPL.Portal.Services
{
    public class CatalogoTipoApiCliente
    {
        private readonly HttpClient httpClient;

        public CatalogoTipoApiCliente(IHttpClientFactory factory)
        {
            httpClient = factory.CreateClient("ApiClient");
        }

        public async Task<IEnumerable<CatalogoTipoDTO>> ListarAsync()
        {
            var response = await httpClient.GetAsync("api/CatalogoTipo/listar");
            response.EnsureSuccessStatusCode();

            var catalogoTipo = await response.Content.ReadFromJsonAsync<IEnumerable<CatalogoTipoDTO>>();
            return catalogoTipo ?? [];
        }
    }
}
