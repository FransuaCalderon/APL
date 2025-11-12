using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Handlers.Interfaces;
using AppAPL.Dto.Email;

namespace AppAPL.Api.Handlers
{
    public class AcuerdosEmailHandler (IEmailRepositorio emailRepo, ILogger<AcuerdosEmailHandler> logger) : IAcuerdosEmailHandler
    {
        public async Task HandleAsync(string entidad, string tipoProceso, string idDocumento)
        {

            logger.LogInformation($"📧 [Fondos] Iniciando envío de correo para Entidad={entidad}, TipoProceso={tipoProceso}, Id={idDocumento}");

            // Consultar los datos del SP
            var request = new ConsultarDatosCorreoRequest
            {
                Entidad = entidad,
                TipoProceso = tipoProceso,
                IdDocumento = idDocumento
            };

            var datos = await emailRepo.ObtenerDatosCorreo(request);

            var plantilla = datos.FirstOrDefault(d => d.tipo_registro == "PLANTILLA");
            var destinatarios = datos.Where(d => d.tipo_registro == "DESTINATARIO").ToList();

            if (plantilla == null || !destinatarios.Any())
            {
                logger.LogWarning("⚠️ [Fondos] No se encontraron datos de plantilla o destinatarios para el correo.");
                return;
            }

            // 2️⃣ Extraer listas de correos
            var toList = destinatarios
                .Where(d => !string.IsNullOrWhiteSpace(d.para))
                .Select(d => d.para)
                .Distinct()
                .ToList();

            var ccList = destinatarios
                .Where(d => !string.IsNullOrWhiteSpace(d.cc))
                .Select(d => d.cc)
                .Distinct()
                .ToList();

            // 3️⃣ Placeholder de ejemplo (puedes ajustar según tu plantilla HTML)
            var placeholders = new Dictionary<string, string>
            {
                { "Entidad", entidad },
                { "Documento", idDocumento },
                { "TipoProceso", tipoProceso }
            };

            // 4️⃣ Enviar el correo usando tu repositorio
            await emailRepo.SendEmailAsync(
                toList: toList,
                subject: $"Notificación: {tipoProceso}",
                templateName: plantilla.nombrearchivo,
                placeholders: placeholders,
                ccList: ccList
            );
        }
    }
}
