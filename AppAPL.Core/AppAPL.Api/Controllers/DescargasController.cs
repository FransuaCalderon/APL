using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace AppAPL.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DescargasController (IConfiguration config, ILogger<DescargasController> logger, IWebHostEnvironment env) : ControllerBase
    {
        /*
        [HttpGet("descargar/{nombreArchivo}")]
        public async Task<IActionResult> DescargarArchivoAsync(string nombreArchivo)
        {
            // 1. Obtener el nombre de la carpeta desde el appsettings.json
            // Si no está configurado, usamos "ArchivoSoportes" por defecto
            string nombreCarpetaConfig = config.GetValue<string>("ConfiguracionArchivos:ArchivoSoportes") ?? "ArchivoSoportes";

            // 2. Construir la ruta física completa usando la raíz del entorno
            string carpetaBase = Path.Combine(env.ContentRootPath, nombreCarpetaConfig);

            // 3. Validar si la carpeta existe. Si no existe, obviamente el archivo tampoco.
            if (!Directory.Exists(carpetaBase))
            {
                logger.LogWarning($"La carpeta configurada '{nombreCarpetaConfig}' no existe en el servidor.");
                return NotFound("El almacén de archivos no ha sido creado o no existe.");
            }

            // 4. Construir la ruta completa al archivo solicitado
            string rutaCompleta = Path.Combine(carpetaBase, nombreArchivo);

            logger.LogInformation($"rutaCompleta: {rutaCompleta}");
            // 5. Verificación de existencia del archivo
            if (!System.IO.File.Exists(rutaCompleta))
            {
                logger.LogWarning($"Archivo no encontrado: {rutaCompleta}");
                return NotFound("El archivo solicitado no existe en el servidor.");
            }

            // 6. Validar extensiones (opcional pero recomendado por seguridad)
            var extensionesPermitidas = config.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<List<string>>();
            string extension = Path.GetExtension(rutaCompleta).ToLower();

            if (extensionesPermitidas != null && !extensionesPermitidas.Contains(extension))
            {
                return BadRequest("El tipo de archivo solicitado no está permitido para descarga.");
            }

            // 7. Determinar el Content-Type (MIME)
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(rutaCompleta, out string contentType))
            {
                contentType = "application/octet-stream";
            }

            // 8. Retorno eficiente mediante Stream
            // .NET se encarga de cerrar el FileStream automáticamente al terminar la descarga
            var stream = new FileStream(rutaCompleta, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, useAsync: true);

            return File(stream, contentType, nombreArchivo);
        }*/

        [HttpGet("descargar/{nombreArchivo}")]
        public async Task<IActionResult> DescargarArchivoAsync(string nombreArchivo)
        {
            string nombreCarpetaConfig = config.GetValue<string>("ConfiguracionArchivos:ArchivoSoportes") ?? "ArchivoSoportes";
            string carpetaBase = Path.Combine(env.ContentRootPath, nombreCarpetaConfig);

            if (!Directory.Exists(carpetaBase))
            {
                logger.LogWarning($"La carpeta configurada '{nombreCarpetaConfig}' no existe en el servidor.");
                return NotFound("El almacén de archivos no ha sido creado o no existe.");
            }

            string rutaCompleta = Path.Combine(carpetaBase, nombreArchivo);
            logger.LogInformation($"rutaCompleta: {rutaCompleta}");

            if (!System.IO.File.Exists(rutaCompleta))
            {
                logger.LogWarning($"Archivo no encontrado: {rutaCompleta}");
                return NotFound("El archivo solicitado no existe en el servidor.");
            }

            var extensionesPermitidas = config.GetSection("ConfiguracionArchivos:ExtensionesPermitidas").Get<List<string>>();
            string extension = Path.GetExtension(rutaCompleta).ToLower();

            if (extensionesPermitidas != null && !extensionesPermitidas.Contains(extension))
            {
                return BadRequest("El tipo de archivo solicitado no está permitido para descarga.");
            }

            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(rutaCompleta, out string contentType))
            {
                contentType = "application/octet-stream";
            }

            // --- NUEVO PASO 8: Convertir a Base64 ---
            // Leemos el archivo completo de forma asíncrona
            byte[] fileBytes = await System.IO.File.ReadAllBytesAsync(rutaCompleta);

            // Lo convertimos a string Base64
            string base64String = Convert.ToBase64String(fileBytes);

            // Retornamos un JSON estructural que tu proxy de Apigee no tendrá problemas en procesar
            return Ok(new
            {
                nombreArchivo = nombreArchivo,
                contentType = contentType,
                archivoBase64 = base64String
            });
        }
    }
}
