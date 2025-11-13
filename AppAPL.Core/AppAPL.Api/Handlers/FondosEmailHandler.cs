using System.Globalization;
using System.Text.Json;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Api.Handlers.Interfaces;
using AppAPL.Dto.Email;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
using Humanizer;


namespace AppAPL.Api.Handlers
{
    public class FondosEmailHandler (IEmailRepositorio emailRepo, ILogger<FondosEmailHandler> logger, IProveedorRepositorio proveedorRepo) : IFondosEmailHandler
    {
        public async Task HandleAsync(string entidad, TipoProceso tipoProceso, string bodyJson, FondoDTO? fondoAntiguo = null)
        {
            logger.LogInformation($"📨 [FondosHandler] Procesando correo. Entidad={entidad}, TipoProceso={tipoProceso}");
            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // 🔹 Mapear el enum a la etiqueta que usa el SP
            string tipoProcEtiqueta = tipoProceso switch
            {
                TipoProceso.Creacion => "TPCREACION",
                TipoProceso.Modificacion => "TPMODIFICACION",
                TipoProceso.Aprobacion => "TPAPROBACION",
                TipoProceso.Inactivacion => "TPINACTIVACION",
                _ => tipoProceso.ToString().ToUpper()
            };

            // 1. Declaramos las variables que llenará el switch
            string IdProveedor;
            Dictionary<string, string> camposPlantilla;

            // 2. Aplicamos el "Strategy Pattern". 
            // Cada 'case' es una estrategia completa: deserializa el DTO correcto
            // y construye los campos de plantilla específicos para ese DTO.


            var proveedorLista = await proveedorRepo.ListarAsync();
            

            switch (tipoProceso)
            {
                case TipoProceso.Creacion:
                    var reqCreacion = JsonSerializer.Deserialize<CrearFondoRequest>(bodyJson, jsonOptions);
                    if (reqCreacion == null || string.IsNullOrEmpty(reqCreacion.IdProveedor))
                    {
                        logger.LogWarning("⚠️ [FondosHandler] No se pudo obtener IdProveedor de CrearFondoRequest.");
                        return;
                    }

                    IdProveedor = reqCreacion.IdProveedor;
                    var proveedor = proveedorLista.FirstOrDefault(d => d.Identificacion == IdProveedor);
                    camposPlantilla = new Dictionary<string, string>
                    {
                        { "Nombre", reqCreacion.NombreUsuarioIngreso },
                        { "IdFondo", reqCreacion.IdProveedor },
                        { "NombreProveedor", proveedor.Nombre }, //consultar de tabla proveedores
                        { "ValorFondo", reqCreacion.ValorFondo.ToString("N2") },
                        { "ValorFondoLetras", this.ConvertirDecimalAPalabras(reqCreacion.ValorFondo) },
                        { "FechaInicio", reqCreacion.FechaInicioVigencia.ToString() },
                        { "FechaFin", reqCreacion.FechaInicioVigencia.ToString() },
                        { "Firma", reqCreacion.NombreUsuarioIngreso },
                        // { "OtroCampoDeCreacion", reqCreacion.OtroCampo } // Ejemplo
                    };
                    break;

                case TipoProceso.Modificacion:
                    // Asumo que tienes un DTO 'ModificarFondoRequest'
                    var reqModif = JsonSerializer.Deserialize<ActualizarFondoRequest>(bodyJson, jsonOptions);
                    if (reqModif == null || string.IsNullOrEmpty(reqModif.IdProveedor))
                    {
                        logger.LogWarning("⚠️ [FondosHandler] No se pudo obtener IdProveedor de ModificarFondoRequest.");
                        return;
                    }

                    IdProveedor = reqModif.IdProveedor;
                    camposPlantilla = new Dictionary<string, string>
                    {
                        { "Operacion", tipoProcEtiqueta },
                        { "Proveedor", reqModif.IdProveedor },
                        { "UsuarioModifica", reqModif.IdUsuarioModifica }, // Ejemplo
                        { "Fecha", DateTime.Now.ToString("dd/MM/yyyy HH:mm") }
                    };
                    break;

                // Aquí agregarías los otros casos (Aprobacion, Inactivacion)
                // case TipoProceso.Aprobacion:
                //    ...
                //    break;

                default:
                    logger.LogWarning($"⚠️ [FondosHandler] TipoProceso no reconocido o sin estrategia definida: {tipoProceso}.");
                    return;
            }

            // 3. A partir de aquí, la lógica es común y ya tiene los datos correctos
            //    (IdProveedor y camposPlantilla) sin importar qué 'case' se ejecutó.

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

            await emailRepo.SendEmailAsync(
                toList,
                $"Notificación: {tipoProcEtiqueta}",
                plantilla.nombrearchivo,
                camposPlantilla, // Usamos el diccionario llenado en el switch
                ccList
            );
        }


        private string ConvertirDecimalAPalabras(decimal valor)
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
                return $"{palabrasEnteras} con {palabrasDecimales}".ToUpper();
            }
            else
            {
                return palabrasEnteras.ToUpper();
            }
        }


    }
}
