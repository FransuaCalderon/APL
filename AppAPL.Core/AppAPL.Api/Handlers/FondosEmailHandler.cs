using System.Text.Json;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Api.Handlers.Interfaces;
using AppAPL.Dto.Email;
using AppAPL.Dto.Fondos;

namespace AppAPL.Api.Handlers
{
    public class FondosEmailHandler (IEmailRepositorio emailRepo, ILogger<FondosEmailHandler> logger) : IFondosEmailHandler
    {
        public async Task HandleAsync(string entidad, TipoProceso tipoProceso, string bodyJson)
        {
            logger.LogInformation($"📨 [FondosHandler] Procesando correo. Entidad={entidad}, TipoProceso={tipoProceso}");
            //logger.LogInformation($"bodyJson: {bodyJson}");
            // 🔹 Convertir el body a su DTO correspondiente
            var request = JsonSerializer.Deserialize<CrearFondoRequest>(bodyJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (request == null || string.IsNullOrEmpty(request.IdProveedor))
            {
                logger.LogWarning("⚠️ [FondosHandler] No se pudo obtener IdProveedor del body.");
                return;
            }

            // 🔹 Mapear el enum a la etiqueta que usa el SP
            string tipoProcEtiqueta = tipoProceso switch
            {
                TipoProceso.Creacion => "TPCREACION",
                TipoProceso.Modificacion => "TPMODIFICACION",
                TipoProceso.Aprobacion => "TPAPROBACION",
                TipoProceso.Inactivacion => "TPINACTIVACION",
                _ => tipoProceso.ToString().ToUpper()
            };

            // 🔹 Consultar SP y enviar correo
            var datos = await emailRepo.ObtenerDatosCorreo(new ConsultarDatosCorreoRequest
            {
                Entidad = entidad,
                TipoProceso = tipoProcEtiqueta,
                IdDocumento = request.IdProveedor
            });

            var plantilla = datos.FirstOrDefault(d => d.tipo_registro == "PLANTILLA");
            var destinatarios = datos.Where(d => d.tipo_registro == "DESTINATARIO").ToList();

            if (plantilla == null || !destinatarios.Any())
            {
                logger.LogWarning("⚠️ [FondosHandler] No se encontraron datos para enviar correo.");
                return;
            }

            var toList = destinatarios
                .Select(d => d.para)
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Distinct()
                .ToList();

            var ccList = destinatarios
                .Select(d => d.cc)
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Distinct()
                .ToList();

            /*
            var destinatarios2 = new List<string> { "juanzoller95@gmail.com" };
            var placeholders = new Dictionary<string, string>
            {
                { "Operacion", tipoProcEtiqueta },
                { "Proveedor", request.IdProveedor },
                { "Fecha", DateTime.Now.ToString("dd/MM/yyyy HH:mm") }
            };

            
            
            await emailRepo.SendEmailAsync(
                toList,
                $"Notificación: {tipoProcEtiqueta}",
                plantilla.nombrearchivo,
                placeholders,
                ccList
            );*/


            var destinatarios2 = new List<string> { "juanzoller95@gmail.com", "cliente2@gmail.com" };
            var datos2 = new Dictionary<string, string>
                    {
                    { "Nombre", "Daniel" },
                    { "FechaRegistro", DateTime.Now.ToString("dd/MM/yyyy") }
                    };

            await emailRepo.SendEmailAsync(
            toList: destinatarios2,
            subject: "Bienvenido a Mi Aplicación ",
            templateName: "CorreoBienvenida.html",
            placeholders: datos2
            );
        }
    }
}
