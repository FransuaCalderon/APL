namespace AppAPL.Api.Utilidades
{
    public static class RouterHelper
    {
        /// <summary>
        /// Crea el envoltorio estándar requerido por el API Router (Apigee).
        /// </summary>
        public static object Formatear(object? data, int httpCode, string mensaje, bool esError = false)
        {
            return new
            {
                status = esError ? "error" : "ok",
                code_status = httpCode,
                json_response = new
                {
                    // Si data es null, enviamos un objeto vacío o null según prefieras
                    data = data ?? new { },
                    result = new
                    {
                        statusCode = httpCode.ToString(),
                        title = esError ? "Error" : "OK",
                        message = mensaje
                    }
                },
                uniTransac = DateTime.Now.ToString("yyyyMMddHHmmssffff")
            };
        }
    }
}
