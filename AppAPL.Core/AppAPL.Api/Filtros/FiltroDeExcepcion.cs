using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Data.SqlClient;
using System.Diagnostics;

namespace AppAPL.Api.Filtros
{
    public class FiltroDeExcepcion : ExceptionFilterAttribute
    {
        private readonly ILogger<FiltroDeExcepcion> logger;
        private const string NAMESPACE_PROYECTO = "AppAPL";
        public FiltroDeExcepcion(ILogger<FiltroDeExcepcion> logger)
        {
            this.logger = logger;
        }


        public override void OnException(ExceptionContext context)
        {
            logger.LogError("------------------------------ OCURRIÓ UNA EXCEPCIÓN ----------------------------------");
            logger.LogError($"ERROR EN LA ACCIÓN: {context.ActionDescriptor.DisplayName}");

            var ex = context.Exception;
            logger.LogError($"Tipo de excepción: {ex.GetType().Name} | Mensaje: {ex.Message}");

            // Solo loguear el stack trace del código del proyecto
            LogStackTraceProyecto(ex);

            // Manejo según tipo de excepción
            context.Result = ex switch
            {
                SqlException sqlEx => CrearResultado(500, "Error en la base de datos.", sqlEx.Message),
                TaskCanceledException timeoutEx => CrearResultado(408, "La solicitud superó el tiempo de espera.", timeoutEx.Message),
                NullReferenceException nullEx => CrearResultado(500, "Referencia nula en el servidor.", nullEx.Message),
                ArgumentException argEx => CrearResultado(400, "Argumento inválido en la solicitud.", argEx.Message),
                _ => CrearResultado(500, "Ocurrió un error interno en el servidor.", ex.Message)
            };

            logger.LogError("------------------------------------- FIN DE EXCEPCIÓN ----------------------------------------\n");

            base.OnException(context);
        }

        private ObjectResult CrearResultado(int statusCode, string mensaje, string detalle)
        {
            // Solo devuelve al cliente un mensaje genérico, pero loguea el detalle internamente
            return new ObjectResult(new { error = mensaje })
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

                    logger.LogError($"➡️ Clase: {className}, Método: {method.Name}, Archivo: {fileName ?? "N/A"}, Línea: {lineNumber}");
                }
            }

            // Si ningún frame pertenece al proyecto, igual dejamos un rastro mínimo
            if (!logueoAlgo)
                logger.LogWarning("⚠️ No se encontraron llamadas dentro del namespace del proyecto en el stack trace.");
        }

    }
}