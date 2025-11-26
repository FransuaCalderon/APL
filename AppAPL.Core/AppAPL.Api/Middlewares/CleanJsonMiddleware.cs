using System.Text;

namespace AppAPL.Api.Middlewares
{
    public class CleanJsonMiddleware(RequestDelegate next, ILogger<CleanJsonMiddleware> logger)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.ContentType != null &&
                context.Request.ContentType.Contains("application/json"))
            {
                context.Request.EnableBuffering();

                using var reader = new StreamReader(
                    context.Request.Body,
                    encoding: Encoding.UTF8,
                    leaveOpen: true
                );

                var originalBody = await reader.ReadToEndAsync();

                // LOG
                /*
                if (originalBody.Length <= 5000)
                    logger.LogInformation("JSON original recibido: {body}", originalBody);*/

                string cleanedBody = originalBody;

                bool contieneNBSP = cleanedBody.Contains("\u00A0");
                bool contieneZWSP = cleanedBody.Contains("\u200B");
                bool contieneBOM = cleanedBody.Contains("\uFEFF");

                if (contieneNBSP || contieneZWSP || contieneBOM)
                {
                    logger.LogInformation("JSON contiene caracteres invisibles. NBSP:{nbsp} ZWSP:{zwsp} BOM:{bom}",
                        contieneNBSP, contieneZWSP, contieneBOM);

                    cleanedBody = cleanedBody
                        .Replace("\u00A0", " ")   // NBSP
                        .Replace("\u200B", "")    // Zero-width space
                        .Replace("\uFEFF", "");   // BOM

                    logger.LogInformation("JSON limpiado correctamente.");
                }

                // Crear nuevo MemoryStream con el JSON limpio
                var cleanBytes = Encoding.UTF8.GetBytes(cleanedBody);
                var newBodyStream = new MemoryStream(cleanBytes);

                // Reemplazar el Body original
                context.Request.Body = newBodyStream;

                // Posición al inicio para que el modelo pueda leer
                context.Request.Body.Position = 0;
            }

            await next(context);
        }
    }
}
