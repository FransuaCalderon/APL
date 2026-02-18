using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Api.Handlers.Interfaces;
using AppAPL.Dto;
using AppAPL.Dto.Fondos;
using AppAPL.Dto.Promocion;
using System.Text.Json;

namespace AppAPL.Api.Handlers
{
    public class PromocionesEmailHandler (IEmailRepositorio emailRepo, ILogger<PromocionesEmailHandler> logger) 
        : HandlerBase (emailRepo, logger) ,IPromocionesEmailHandler
    {

        public async Task HandleAsync(string entidad, TipoProceso tipoProceso, string requestBody, BandAproPromocionDTO? promocionAntiguo = null, string? responseBody = null)
        {
            logger.LogInformation($"[PromocionesHandler] Procesando correo. Entidad={entidad}, TipoProceso={tipoProceso}");
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
            string IdProveedor = "";
            Dictionary<string, string> camposPlantilla = null;
            string notificacion = "";

            // 2. Aplicamos el "Strategy Pattern". 
            // Cada 'case' es una estrategia completa: deserializa el DTO correcto
            // y construye los campos de plantilla específicos para ese DTO.

            switch (tipoProceso)
            {
                case TipoProceso.Creacion:
                    /*
                    var reqCreacion = JsonSerializer.Deserialize<CrearFondoRequest>(requestBody, jsonOptions);
                    if (reqCreacion == null || string.IsNullOrEmpty(reqCreacion.IdProveedor))
                    {
                        logger.LogWarning("⚠️ [PromocionesHandler] No se pudo obtener IdProveedor de CrearFondoRequest.");
                        return;
                    }

                    var retorno = JsonSerializer.Deserialize<ControlErroresDTO>(responseBody, jsonOptions);
                    if (retorno == null)
                    {
                        logger.LogWarning("No existe Response body");
                        return;
                    }

                    IdProveedor = reqCreacion.IdProveedor;
                    var proveedor = await proveedorRepo.ObtenerPorIdAsync(IdProveedor);

                    if (proveedor == null)
                    {
                        logger.LogWarning($"no se encontro proveedor con el idproveedor: {IdProveedor}");
                        return;
                    }

                    camposPlantilla = new Dictionary<string, string>
                    {
                        { "Nombre", reqCreacion.NombreUsuarioIngreso },
                        { "IdFondo", retorno.Id.ToString() },
                        { "IdProveedor", proveedor.Identificacion },
                        { "NombreProveedor", proveedor.Nombre },
                        { "ValorFondo", this.FormatearAMoneda(reqCreacion.ValorFondo) },
                        { "ValorFondoLetras", this.ConvertirDecimalAPalabras(reqCreacion.ValorFondo) },
                        { "FechaInicio", reqCreacion.FechaInicioVigencia.ToString() },
                        { "FechaFin", reqCreacion.FechaFinVigencia.ToString() },
                        { "Firma", reqCreacion.NombreUsuarioIngreso },
                        // { "OtroCampoDeCreacion", reqCreacion.OtroCampo } // Ejemplo
                    };

                    notificacion = $"apl solicitud {tipoProceso} fondo".ToUpper();
                    */
                    break;

                case TipoProceso.Modificacion:

                    /*
                    // Asumo que tienes un DTO 'ModificarFondoRequest'
                    var reqModif = JsonSerializer.Deserialize<ActualizarFondoRequest>(requestBody, jsonOptions);
                    if (reqModif == null || string.IsNullOrEmpty(reqModif.IdProveedor))
                    {
                        logger.LogWarning("⚠️ [PromocionesHandler] No se pudo obtener IdProveedor de ModificarFondoRequest.");
                        return;
                    }

                    if (fondoAntiguo == null)
                    {
                        logger.LogWarning("⚠️ [PromocionesHandler] No se pudo obtener fondo antiguo");
                        return;
                    }

                    IdProveedor = reqModif.IdProveedor;

                    var proveedorAntiguo = await proveedorRepo.ObtenerPorIdAsync(fondoAntiguo.IdProveedor);
                    var proveedorNuevo = await proveedorRepo.ObtenerPorIdAsync(reqModif.IdProveedor);

                    if (proveedorAntiguo == null || proveedorNuevo == null)
                    {
                        logger.LogWarning($"no se encontro proveedores, proveedorAntiguo: {fondoAntiguo.IdProveedor}, proveedorNuevo:  {reqModif.IdProveedor}");
                        return;
                    }

                    camposPlantilla = new Dictionary<string, string>
                    {
                        { "Nombre", reqModif.NombreUsuarioModifica },
                        { "IdFondo", fondoAntiguo.IdFondo.ToString() },
                        { "NombreProveedor", proveedorAntiguo.Nombre },
                        { "IdProveedor", proveedorAntiguo.Identificacion },
                        { "NuevoNombreProveedor", proveedorNuevo.Nombre },
                        { "NuevoIdProveedor", proveedorNuevo.Identificacion },
                        { "ValorFondo", this.FormatearAMoneda((decimal)fondoAntiguo.ValorFondo) },
                        { "ValorFondoLetras", this.ConvertirDecimalAPalabras((decimal)fondoAntiguo.ValorFondo) },
                        { "NuevoValorFondo", this.FormatearAMoneda(reqModif.ValorFondo) },
                        { "NuevoValorFondoLetras", this.ConvertirDecimalAPalabras(reqModif.ValorFondo) },
                        { "FechaInicio", fondoAntiguo.FechaInicioVigencia.ToString() },
                        { "NuevaFechaInicio", reqModif.FechaInicioVigencia.ToString() },
                        { "FechaFin", fondoAntiguo.FechaFinVigencia.ToString() },
                        { "NuevaFechaFin", reqModif.FechaFinVigencia.ToString() },
                        { "ValorDisponible", this.FormatearAMoneda((decimal)fondoAntiguo.ValorDisponible) },
                        { "NuevoValorDisponible", this.FormatearAMoneda(reqModif.ValorFondo) },
                        { "ValorComprometido", this.FormatearAMoneda((decimal)fondoAntiguo.ValorComprometido) },
                        { "NuevoValorComprometido", "0.00" },
                        { "ValorLiquidado", this.FormatearAMoneda((decimal)fondoAntiguo.ValorLiquidado) },
                        { "NuevoValorLiquidado", "0.00" },
                        { "Firma", reqModif.NombreUsuarioModifica },
                    };

                    notificacion = $"apl solicitud {tipoProceso} fondo".ToUpper();

                    */
                    break;


                case TipoProceso.Aprobacion:
                    /*
                    var reqAprobacion = JsonSerializer.Deserialize<AprobarFondoRequest>(requestBody, jsonOptions);
                    if (reqAprobacion == null || reqAprobacion.Identidad == null)
                    {
                        logger.LogWarning("⚠️ [PromocionesHandler] No se pudo obtener Identidad de AprobarFondoRequest.");
                        return;
                    }

                    string estadoCorreo = reqAprobacion.IdEtiquetaEstado switch
                    {
                        "ESTADOAPROBADO" => "APROBADO",
                        "ESTADONEGADO" => "NEGADO"
                    };

                    string etiquetaTipoProceso = reqAprobacion.IdEtiquetaTipoProceso switch
                    {
                        "TPCREACION" => "CREACION",
                        "TPINACTIVACION" => "INACTIVACION"
                    };

                    var fondo = await fondoRepo.ObtenerPorIdAsync((int)reqAprobacion.Identidad);

                    if (fondo == null)
                    {
                        logger.LogWarning($"no se encontro el fondo con el id: {reqAprobacion.Identidad}");
                        return;
                    }

                    IdProveedor = fondo.IdProveedor;
                    var proveedor3 = await proveedorRepo.ObtenerPorIdAsync(IdProveedor);

                    if (proveedor3 == null)
                    {
                        logger.LogWarning($"no se encontro proveedor con el idproveedor: {IdProveedor}");
                        return;
                    }

                    camposPlantilla = new Dictionary<string, string>
                      {
                        { "Nombre", fondo.IdUsuarioIngreso },
                        { "IdFondo", fondo.IdFondo.ToString() },
                        { "NombreProveedor", proveedor3.Nombre },
                        { "IdProveedor", proveedor3.Identificacion },
                        { "ValorFondo", this.FormatearAMoneda((decimal)fondo.ValorFondo) },
                        { "ValorFondoLetras", this.ConvertirDecimalAPalabras((decimal)fondo.ValorFondo) },
                        { "FechaInicio", fondo.FechaInicioVigencia.ToString() },
                        { "FechaFin", fondo.FechaFinVigencia.ToString() },
                        { "Firma", reqAprobacion.UsuarioAprobador },
                        { "Estado", estadoCorreo },
                        { "TipoProceso", etiquetaTipoProceso },
                      };

                    notificacion = $"apl solicitud {tipoProceso} fondo".ToUpper();

                    */
                    break;


                case TipoProceso.Inactivacion:
                    /*
                    var reqInactivacion = JsonSerializer.Deserialize<InactivarFondoRequest>(requestBody, jsonOptions);
                    if (reqInactivacion == null || reqInactivacion.IdFondo == null)
                    {
                        logger.LogWarning("⚠️ [PromocionesHandler] No se pudo obtener Identidad de AprobarFondoRequest.");
                        return;
                    }


                    var fondo2 = await fondoRepo.ObtenerPorIdAsync((int)reqInactivacion.IdFondo);

                    if (fondo2 == null)
                    {
                        logger.LogWarning($"no se encontro el fondo con el id: {reqInactivacion.IdFondo}");
                        return;
                    }

                    IdProveedor = fondo2.IdProveedor;
                    var proveedor4 = await proveedorRepo.ObtenerPorIdAsync(IdProveedor);

                    if (proveedor4 == null)
                    {
                        logger.LogWarning($"no se encontro proveedor con el idproveedor: {IdProveedor}");
                        return;
                    }

                    camposPlantilla = new Dictionary<string, string>
                        {
                            { "Nombre", fondo2.IdUsuarioIngreso },
                            { "IdFondo", fondo2.IdProveedor },
                            { "NombreProveedor", proveedor4.Nombre },
                            { "IdProveedor", proveedor4.Identificacion },
                            { "ValorFondo", this.FormatearAMoneda((decimal)fondo2.ValorFondo) },
                            { "ValorFondoLetras", this.ConvertirDecimalAPalabras((decimal)fondo2.ValorFondo) },
                            { "FechaInicio", fondo2.FechaInicioVigencia.ToString() },
                            { "FechaFin", fondo2.FechaFinVigencia.ToString() },
                            { "ValorDisponible", this.FormatearAMoneda((decimal)fondo2.ValorDisponible) },
                            { "ValorComprometido", this.FormatearAMoneda((decimal)fondo2.ValorComprometido) },
                            { "ValorLiquidado", this.FormatearAMoneda((decimal)fondo2.ValorLiquidado) },
                            { "Firma", reqInactivacion.NombreUsuarioIngreso },
                            // { "OtroCampoDeCreacion", reqCreacion.OtroCampo } // Ejemplo
                        };

                    notificacion = $"apl solicitud {tipoProceso} fondo".ToUpper();
                    */
                    break;

                default:
                    logger.LogWarning($"[PromocionesHandler] TipoProceso no reconocido o sin estrategia definida: {tipoProceso}.");
                    return;
            }

            // 3. A partir de aquí, la lógica es común y ya tiene los datos correctos
            //    (IdProveedor y camposPlantilla) sin importar qué 'case' se ejecutó.

            if (camposPlantilla != null)
            {
                await EnviarCorreo(entidad, tipoProcEtiqueta, IdProveedor, tipoProceso, camposPlantilla, notificacion);
            }
            else
            {
                logger.LogWarning($"[PromocionesHandler] campos para plantilla de email no definido");
            }
        }


    }
}
