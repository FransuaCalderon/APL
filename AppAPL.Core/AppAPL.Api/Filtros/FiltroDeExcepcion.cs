using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Data.SqlClient;
using System.Diagnostics;

namespace ExpertoAPI2.Filtros
{
    public class FiltroDeExcepcion : ExceptionFilterAttribute
    {
        private readonly ILogger<FiltroDeExcepcion> logger;

        public FiltroDeExcepcion(ILogger<FiltroDeExcepcion> logger)
        {
            this.logger = logger;
        }


        public override void OnException(ExceptionContext context)
        {
            // Log básico de la acción y tipo de excepción
            logger.LogError("------------------------------ OCURRIO UNA EXCEPCION ----------------------------------");
            logger.LogError($"ERROR EN LA ACCION: {context.ActionDescriptor.DisplayName}");

            // Información básica sobre la excepción
            logger.LogError($"Tipo de excepción: {context.Exception.GetType().Name} Mensaje: {context.Exception.Message}");

            // Capturar detalles más específicos de la excepción
            LogStackTrace(context.Exception);

            // Manejo específico para diferentes tipos de excepciones
            switch (context.Exception)
            {
                case SqlException sqlEx:
                    logger.LogError("Error con la base de datos: " + sqlEx.Message);
                    logger.LogError($"Stack Trace SQL: {sqlEx.StackTrace}");
                    context.Result = new ObjectResult("Error en la base de datos.")
                    {
                        StatusCode = StatusCodes.Status500InternalServerError
                    };
                    break;

                case TaskCanceledException timeoutEx:
                    logger.LogError("Error de timeout en la solicitud HTTP: " + timeoutEx.Message);
                    logger.LogError($"Stack Trace Timeout: {timeoutEx.StackTrace}");
                    context.Result = new ObjectResult("La solicitud ha superado el tiempo de espera.")
                    {
                        StatusCode = StatusCodes.Status408RequestTimeout
                    };
                    break;

                case NullReferenceException nullEx:
                    logger.LogError("Excepción de referencia nula: " + nullEx.Message);
                    logger.LogError($"Stack Trace NullReferenceException: {nullEx.StackTrace}");
                    context.Result = new ObjectResult("Error de referencia nula en el servidor.")
                    {
                        StatusCode = StatusCodes.Status500InternalServerError
                    };
                    break;

                case ArgumentException argEx:
                    logger.LogError("Argumento inválido: " + argEx.Message);
                    logger.LogError($"Stack Trace ArgumentException: {argEx.StackTrace}");
                    context.Result = new ObjectResult("Argumento inválido en la solicitud.")
                    {
                        StatusCode = StatusCodes.Status400BadRequest
                    };
                    break;

                // Otros casos generales de excepción
                default:
                    logger.LogError("Error desconocido: " + context.Exception.Message);
                    logger.LogError($"Stack Trace Error desconocido: {context.Exception.StackTrace}");
                    context.Result = new ObjectResult("Ocurrió un error interno.")
                    {
                        StatusCode = StatusCodes.Status500InternalServerError
                    };
                    break;
            }

            logger.LogError("------------------------------------- FIN DE EXCEPCION ----------------------------------------\n\n");

            base.OnException(context);
        }

        private void LogStackTrace(Exception exception)
        {
            // Obtener el stack trace de la excepción
            var stackTrace = new StackTrace(exception, true); // El 'true' incluye la información de línea

            // Iterar sobre los frames del stack trace para obtener la información de cada uno
            foreach (var frame in stackTrace.GetFrames())
            {
                var method = frame.GetMethod();
                var fileName = frame.GetFileName();
                var lineNumber = frame.GetFileLineNumber();
                var className = method.DeclaringType?.FullName;

                // Filtrar solo las clases que pertenecen a tu proyecto
                if (className != null && className.StartsWith("ExpertoAPI2")) // Cambia esto si hay otros namespaces en tu proyecto
                {
                    // Loguear información detallada sobre el método, clase y línea
                    if (fileName != null)
                    {
                        logger.LogError($"Excepción en la clase: {className}, Método: {method.Name}, Archivo: {fileName}, Línea: {lineNumber}");
                    }
                    else
                    {
                        logger.LogError($"Excepción en la clase: {className}, Método: {method.Name}, No disponible el archivo o línea.");
                    }
                }
            }
        }

    }
}
//Autor: Juan Daniel Zoller L. | Empresa: BMTECSA | Fecha: 1 de Julio de 2025 - 30 de Septiembre del 2025 | Proyecto: Migración EXPERTO