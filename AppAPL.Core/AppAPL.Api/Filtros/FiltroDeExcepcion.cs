using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Data.SqlClient;
using Oracle.ManagedDataAccess.Client;
using System.Diagnostics;

namespace AppAPL.Api.Filtros
{
    public class FiltroDeExcepcion : ExceptionFilterAttribute
    {
        private readonly ILogger<FiltroDeExcepcion> logger;
        private const string NAMESPACE_PROYECTO = "AppAPL";
        private readonly int processId = Thread.CurrentThread.ManagedThreadId;
        public FiltroDeExcepcion(ILogger<FiltroDeExcepcion> logger)
        {
            this.logger = logger;
        }


        public override void OnException(ExceptionContext context)
        {
            logger.LogError($"------------------------------ OCURRIÓ UNA EXCEPCIÓN [hilo: {this.processId}]----------------------------------");
            logger.LogError($"[hilo: {this.processId}] ERROR EN LA ACCIÓN: {context.ActionDescriptor.DisplayName}");

            var ex = context.Exception;
            logger.LogError($"[hilo: {this.processId}] Tipo de excepción: {ex.GetType().Name} | Mensaje: {ex.Message}");

            // Solo loguear el stack trace del código del proyecto
            LogStackTraceProyecto(ex);

            // Manejo según tipo de excepción
            context.Result = ex switch
            {
                // 🔹 Error de Oracle
                OracleException oracleEx => CrearResultadoOracle(oracleEx),
                SqlException sqlEx => CrearResultado(500, "Error en la base de datos.", sqlEx.Message),
                TaskCanceledException timeoutEx => CrearResultado(408, "La solicitud superó el tiempo de espera.", timeoutEx.Message),
                NullReferenceException nullEx => CrearResultado(500, "Referencia nula en el servidor.", nullEx.Message),
                ArgumentException argEx => CrearResultado(400, "Argumento inválido en la solicitud.", argEx.Message),
                NotImplementedException notImpleEx => CrearResultado(400, "Metodo aun no implementado, en desarrollo", notImpleEx.Message),
                _ => CrearResultado(500, "Ocurrió un error interno en el servidor.", ex.Message)
            };

            // ESTA ES LA LÍNEA QUE HACE QUE EL RESPONSE SE ENVÍE AL CLIENTE
            context.ExceptionHandled = true;

            logger.LogError("------------------------------------- FIN DE EXCEPCIÓN ----------------------------------------\n");

            base.OnException(context);
        }

        private ObjectResult CrearResultadoOracle(OracleException ex)
        {
            int codigoError = ex.Number;
            string mensajeError = ex.Message;

            // Limpia el prefijo "ORA-20050:" si existe
            if (mensajeError.Contains(":"))
                mensajeError = mensajeError.Substring(mensajeError.IndexOf(':') + 1).Trim();

            // Puedes decidir cómo mapear el código Oracle a un status HTTP
            //int statusCode = (codigoError >= -20999 && codigoError <= -20000) ? 400 : 500;

            logger.LogError($"⚠️ Error Oracle {codigoError}: {mensajeError}");

            return new ObjectResult(new
            {
                codigoRetorno = codigoError,
                mensaje = mensajeError
            })
            {
                StatusCode = 400
            };
        }

        private ObjectResult CrearResultado(int statusCode, string mensaje, string detalle)
        {
            // Solo devuelve al cliente un mensaje genérico, pero loguea el detalle internamente
            return new ObjectResult(new
            {
                mensaje = mensaje,
                detalle = detalle
            })
            {
                StatusCode = statusCode
            };
        }

        private void LogStackTraceProyecto(Exception exception)
        {
            var stackTrace = new StackTrace(exception, true);
            var frames = stackTrace.GetFrames();

            if (frames == null) return;

            bool logueoAlgo = false;

            foreach (var frame in frames)
            {
                var method = frame.GetMethod();
                var className = method.DeclaringType?.FullName;

                // 🔍 Filtrar solo las clases del namespace de tu proyecto
                if (className != null && className.StartsWith(NAMESPACE_PROYECTO))
                {
                    logueoAlgo = true;
                    var fileName = frame.GetFileName();
                    var lineNumber = frame.GetFileLineNumber();

                    logger.LogError($"[hilo: {this.processId}] Clase: {className}, Método: {method.Name}, Archivo: {fileName ?? "N/A"}, Línea: {lineNumber}");
                }
            }

            // Si ningún frame pertenece al proyecto, igual dejamos un rastro mínimo
            if (!logueoAlgo)
                logger.LogWarning($"[hilo: {this.processId}] No se encontraron llamadas dentro del namespace del proyecto en el stack trace.");
        }

    }
}