using AppAPL.Dto.Opciones;
using System.Net.Http;

namespace AppAPL.Portal.Services
{
    public class OpcionesApiClient
    {
        private readonly HttpClient httpClient;

        public OpcionesApiClient(IHttpClientFactory factory)
        {
            httpClient = factory.CreateClient("ApiClient");
        }

        public async Task<IEnumerable<OpcionDTO>> ListarAsync()
        {
            var response = await httpClient.GetAsync("api/Opciones/listar");
            response.EnsureSuccessStatusCode();

            var opciones = await response.Content.ReadFromJsonAsync<IEnumerable<OpcionDTO>>();
            return opciones ?? [];
        }
    }
}
