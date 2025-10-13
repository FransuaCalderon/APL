using AppAPL.Dto.Catalogo;
using AppAPL.Dto.Opciones;
using System.Net.Http;

namespace AppAPL.Portal.Services
{
    public class CatalogoApiClient
    {
        private readonly HttpClient httpClient;

        public CatalogoApiClient(IHttpClientFactory factory)
        {
            httpClient = factory.CreateClient("ApiClient");
        }

        public async Task<IEnumerable<CatalogoDTO>> ListarAsync()
        {
            var response = await httpClient.GetAsync("api/Catalogo/listar");
            response.EnsureSuccessStatusCode();

            var catalogo = await response.Content.ReadFromJsonAsync<IEnumerable<CatalogoDTO>>();
            return catalogo ?? [];
        }
    }
}
