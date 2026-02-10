using AppAPL.Api.Utilidades;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Data.SqlClient;
using Oracle.ManagedDataAccess.Client;
using System.Diagnostics;

namespace AppAPL.Api.Filtros
{
    public class FiltroDeExcepcion(ILogger<FiltroDeExcepcion> logger) : ExceptionFilterAttribute
    {
        private const string NAMESPACE_PROYECTO = "AppAPL";
        private readonly int processId = Thread.CurrentThread.ManagedThreadId;

        public override void OnException(ExceptionContext context)
        {
            logger.LogError($"------------------------------ OCURRIÓ UNA EXCEPCIÓN [hilo: {this.processId}]----------------------------------");
            logger.LogError($"[hilo: {this.processId}] ERROR EN LA ACCIÓN: {context.ActionDescriptor.DisplayName}");

            var ex = context.Exception;
            logger.LogError($"[hilo: {this.processId}] Tipo: {ex.GetType().Name} | Mensaje: {ex.Message}");

            // Loguear el stack trace solo de tu código
            LogStackTraceProyecto(ex);

            // Mapeo de excepciones al formato del API Router usando el Helper
            context.Result = ex switch
            {
                OracleException oracleEx => CrearResultadoOracle(oracleEx),

                TaskCanceledException timeoutEx =>
                    GenerarObjectResult(408, "La solicitud superó el tiempo de espera.", timeoutEx.Message),

                ArgumentException argEx =>
                    GenerarObjectResult(400, "Argumento inválido en la solicitud.", argEx.Message),

                NotImplementedException notImpleEx =>
                    GenerarObjectResult(501, "Método aún no implementado.", notImpleEx.Message),

                _ => GenerarObjectResult(500, "Ocurrió un error interno en el servidor.", ex.Message)
            };

            context.ExceptionHandled = true;
            logger.LogError("------------------------------------- FIN DE EXCEPCIÓN ----------------------------------------\n");

            base.OnException(context);
        }

        // Método para errores generales
        private ObjectResult GenerarObjectResult(int statusCode, string mensaje, string detalle)
        {
            /*
            // Usamos el Helper de tu carpeta de utilidades
            var respuesta = RouterHelper.Formatear(
                data: new { detalle_error = detalle },
                httpCode: statusCode,
                mensaje: mensaje,
                esError: true
            );*/

            var respuesta = new
            {
                mensaje = mensaje,
                detalle = detalle
            };

            return new ObjectResult(respuesta) { StatusCode = statusCode };
        }

        // Método específico para Oracle
        private ObjectResult CrearResultadoOracle(OracleException ex)
        {
            logger.LogInformation("Generando error de oracle");
            int codigoError = ex.Number;
            string mensajeError = ex.Message;

            // Limpieza de prefijos de Oracle (ej: ORA-20050)
            if (mensajeError.Contains(":"))
                mensajeError = mensajeError.Substring(mensajeError.IndexOf(':') + 1).Trim();

            logger.LogError($"⚠️ Error Oracle {codigoError}: {mensajeError}");

            /*
            // Usamos el Helper indicando que es un error
            var respuesta = RouterHelper.Formatear(
                data: new { oracle_code = codigoError },
                httpCode: 400,
                mensaje: mensajeError,
                esError: true
            );*/

            var respuesta = new
            {
                mensaje = mensajeError
                
            };

            return new ObjectResult(respuesta) { StatusCode = 400 };
        }

        private void LogStackTraceProyecto(Exception exception)
        {
            var stackTrace = new StackTrace(exception, true);
            var frames = stackTrace.GetFrames();
            if (frames == null) return;

            foreach (var frame in frames)
            {
                var method = frame.GetMethod();
                var className = method?.DeclaringType?.FullName;

                if (className != null && className.StartsWith(NAMESPACE_PROYECTO))
                {
                    var fileName = frame.GetFileName();
                    var lineNumber = frame.GetFileLineNumber();
                    logger.LogError($"[hilo: {this.processId}] Clase: {className}, Método: {method.Name}, Línea: {lineNumber}");
                }
            }
        }
    }
}