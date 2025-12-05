using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Dto.Email;
using Humanizer;
using System.Globalization;

namespace AppAPL.Api.Handlers
{
    public class HandlerBase(IEmailRepositorio emailRepo, ILogger logger, ICatalogoRepositorio catalogoRepo)
    {
        protected string ConvertirDecimalAPalabras(decimal valor)
        {
            // 1. Redondeamos a 2 decimales (estándar para moneda)
            // Ej: 150.758 -> 150.76
            decimal valorRedondeado = Math.Round(valor, 2);

            // 2. Separamos la parte entera
            // Ej: 150.76 -> 150
            long parteEntera = (long)Math.Truncate(valorRedondeado);

            // 3. Separamos los decimales
            // Ej: (150.76 - 150) * 100 -> 76
            int parteDecimal = (int)((valorRedondeado - parteEntera) * 100);

            // 4. Convertimos la parte entera (esto es 'long' y funciona)
            string palabrasEnteras = parteEntera.ToWords(new CultureInfo("es"));

            // 5. Combinamos el resultado
            if (parteDecimal > 0)
            {
                // Convertimos la parte decimal (esto es 'int' y funciona)
                string palabrasDecimales = parteDecimal.ToWords(new CultureInfo("es"));
                return $"{palabrasEnteras} DOLARES con {palabrasDecimales} centavos".ToUpper();
            }
            else
            {
                return palabrasEnteras.ToUpper();
            }
        }

        protected async Task EnviarCorreo(string entidad, string tipoProcEtiqueta, string IdProveedor, TipoProceso tipoProceso,
            Dictionary<string, string>? camposPlantilla)
        {
            // 🔹 Consultar SP y enviar correo
            var datos = await emailRepo.ObtenerDatosCorreo(new ConsultarDatosCorreoRequest
            {
                Entidad = entidad,
                TipoProceso = tipoProcEtiqueta,
                IdDocumento = IdProveedor // Usamos la variable llenada en el switch
            });

            var plantilla = datos.FirstOrDefault(d => d.tipo_registro == "PLANTILLA");
            var destinatarios = datos.Where(d => d.tipo_registro == "DESTINATARIO").ToList();

            if (plantilla == null || !destinatarios.Any())
            {
                logger.LogWarning("⚠️ [FondosHandler] No se encontraron datos para enviar correo.");
                return;
            }

            // ... (Tu lógica para toList y ccList no cambia) ...
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

            // 4. Ya no necesitas 'ObtenerCamposPlantilla' ni la validación 'null'.
            //    'camposPlantilla' ya está listo.

            foreach (var item in toList)
            {
                logger.LogInformation($"destinatario: {item}");
            }

            foreach (var item in ccList)
            {
                logger.LogInformation($"cc destinatario: {item}");
            }

            string? nombreEntidad = await this.RetornarNombreEntidad(entidad);

            await emailRepo.SendEmailAsync(
                toList,
                $"Notificación {nombreEntidad}: {tipoProceso}",
                plantilla.nombrearchivo,
                camposPlantilla, // Usamos el diccionario llenado en el switch
                ccList
            );
        }

        protected async Task<string?> RetornarNombreEntidad(string etiquetaEntidad)
        {
            var listaCatalogo = await catalogoRepo.ListarAsync();

            var entidad = listaCatalogo.Where(x => x.IdEtiqueta == etiquetaEntidad).FirstOrDefault();

            return entidad?.Nombre;
        }
    }
}
