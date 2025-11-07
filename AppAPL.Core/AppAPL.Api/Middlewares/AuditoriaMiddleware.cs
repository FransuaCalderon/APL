using AppAPL.Dto.Log;
using AppAPL.Negocio.Abstracciones;

namespace AppAPL.Api.Middlewares
{
    public class AuditoriaMiddleware (RequestDelegate next, ILogger<AuditoriaMiddleware> logger, IServiceProvider serviceProvider) //inyectar aqui el servicio para 
    {
        public async Task InvokeAsync(HttpContext context)
        {
            //var idopcionHeader = context.Request.Headers["idopcion"].FirstOrDefault();
            //var usuario = context.Request.Headers["usuario"].FirstOrDefault();

            var idopcion = context.Request.Headers.TryGetValue("idopcion", out var h1) ? h1.ToString() : "0";
            var usuario = context.Request.Headers.TryGetValue("usuario", out var h2) ? h2.ToString() : "anonimo";
            var idcontrolinterfaz = context.Request.Headers.TryGetValue("idcontrolinterfaz", out var h3) ? h3.ToString() : "0";
            var idevento = context.Request.Headers.TryGetValue("idevento", out var h4) ? h4.ToString() : "0";
            var entidad = context.Request.Headers.TryGetValue("entidad", out var h5) ? h5.ToString() : "0";
            var identidad = context.Request.Headers.TryGetValue("identidad", out var h6) ? h6.ToString() : "0";
            var idtipoproceso = context.Request.Headers.TryGetValue("idtipoproceso", out var h7) ? h7.ToString() : "0";

            var processId = Thread.CurrentThread.ManagedThreadId;
            var metodo = context.Request.Method;
            var path = context.Request.Path;

            logger.LogInformation($"------------------INICIANDO MIDDLEWARE DE AUDITORIA [hilo: {processId}]----------------");



            /*
            if (string.IsNullOrWhiteSpace(usuario) || string.IsNullOrWhiteSpace(idopcionHeader))
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                logger.LogError("Faltan headers requeridos: usuario, idopcion");
                await context.Response.WriteAsync("Faltan headers requeridos: usuario, idopcion");
                return;
            }*/

            /*
            //  Validar que idopcion sea entero
            if (!int.TryParse(idopcionHeader, out int idopcion) || idopcion <= 0)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                logger.LogError("El header 'idopcion' no es un número válido");
                await context.Response.WriteAsync("El header 'idopcion' debe ser un número entero");
                return;
            }*/



            //--------leer body del request
            //------------------------------------------------------
            string requestBody = "";
            if (context.Request.Method is "POST" or "PUT" or "PATCH" &&
                    context.Request.ContentType?.Contains("application/json") == true)
            {
                context.Request.EnableBuffering();

                using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
                requestBody = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;

                logger.LogInformation("Request body en JSON: {Body}", requestBody);
            }
            //-----------------------------------------------------------------------------



            /*
            //---------------leer body del response antes del next------------------------
            var originalBodyStream = context.Response.Body; // stream real
            using var memoryStream = new MemoryStream();
            context.Response.Body = memoryStream; // stream temporal
            //-------------------------------------------------------
            */


            await next(context);



            //se ejecutado despues del llamado http


            /*
            //---------------leer body del response despues del next------------------------

            // Leer el resultado del response
            memoryStream.Seek(0, SeekOrigin.Begin);
            var responseBody = await new StreamReader(memoryStream).ReadToEndAsync();

            // Log
            logger.LogInformation("Response Body: {Body}", responseBody);

            // Devolver la respuesta real al cliente
            memoryStream.Seek(0, SeekOrigin.Begin);
            await memoryStream.CopyToAsync(originalBodyStream);
            context.Response.Body = originalBodyStream;

            //---------------------------------------------------------------------
            */



            //validamos el codigo de estado http
            //si es exitoso podemos llamar un servicio inyectado en el constructor para mandar a grabar datos a la tabla de log
            int status = context.Response.StatusCode;

            bool esExitoso = status >= 200 && status < 300;


            logger.LogInformation($"Codigo de estado HTTP: {status}");
            logger.LogInformation("Request => {Metodo} {Path}", metodo, path);

            logger.LogInformation($"idopcion:{idopcion}, usuario: {usuario}");

            if (esExitoso)
            {
                //aqui aplicar la logica si la respuesta fuera todo ok en rango de 200
                logger.LogInformation($"Request exitoso: {status}");

                using var scope = serviceProvider.CreateScope();
                var logServicio = scope.ServiceProvider.GetRequiredService<ILogServicio>();

                var log = new CrearActualizarLogRequest()
                {
                    IdUser = usuario,
                    IdOpcion = Convert.ToInt32(idopcion),
                    IdControlInterfaz = Convert.ToInt32(idcontrolinterfaz),
                    IdEvento = Convert.ToInt32(idevento),
                    Entidad = Convert.ToInt32(entidad), // todos los campos que viene del front por headers
                    IdEntidad = Convert.ToInt32(identidad),
                    IdTipoProceso = Convert.ToInt32(idtipoproceso),
                    Datos = metodo is "POST" or "PUT" or "PATCH" ? requestBody : "{}"
                };
                
                await logServicio.RegistrarLogOpcionAsync(log);

            }
            else
            {
                logger.LogError($"Request con error: {status}");
            }


            logger.LogInformation($"------------------TERMINANDO MIDDLEWARE DE AUDITORIA [hilo: {processId}] ------------------");
        }
    }
}
