using System.Globalization;
using System.Text.Json;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Api.Handlers.Interfaces;
using AppAPL.Dto;
using AppAPL.Dto.Email;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
using Humanizer;


namespace AppAPL.Api.Handlers
{
    public class FondosEmailHandler (IEmailRepositorio emailRepo, ILogger<FondosEmailHandler> logger, 
        IProveedorRepositorio proveedorRepo, IFondoRepositorio fondoRepo) :  HandlerBase(emailRepo, logger), IFondosEmailHandler
    {
        public async Task HandleAsync(string entidad, TipoProceso tipoProceso, string requestBody, FondoDTO? fondoAntiguo = null, string? responseBody = null)
        {
            logger.LogInformation($"[FondosHandler] Procesando correo. Entidad={entidad}, TipoProceso={tipoProceso}");
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
            Dictionary<string, string> camposPlantilla = null;

            // 2. Aplicamos el "Strategy Pattern". 
            // Cada 'case' es una estrategia completa: deserializa el DTO correcto
            // y construye los campos de plantilla específicos para ese DTO.

            switch (tipoProceso)
            {
                case TipoProceso.Creacion:
                    var reqCreacion = JsonSerializer.Deserialize<CrearFondoRequest>(requestBody, jsonOptions);
                    if (reqCreacion == null || string.IsNullOrEmpty(reqCreacion.IdProveedor))
                    {
                        logger.LogWarning("⚠️ [FondosHandler] No se pudo obtener IdProveedor de CrearFondoRequest.");
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
                        { "ValorFondo", reqCreacion.ValorFondo.ToString("N2") },
                        { "ValorFondoLetras", this.ConvertirDecimalAPalabras(reqCreacion.ValorFondo) },
                        { "FechaInicio", reqCreacion.FechaInicioVigencia.ToString() },
                        { "FechaFin", reqCreacion.FechaFinVigencia.ToString() },
                        { "Firma", reqCreacion.NombreUsuarioIngreso },
                        // { "OtroCampoDeCreacion", reqCreacion.OtroCampo } // Ejemplo
                    };
                    break;

                case TipoProceso.Modificacion: 
                    // Asumo que tienes un DTO 'ModificarFondoRequest'
                    var reqModif = JsonSerializer.Deserialize<ActualizarFondoRequest>(requestBody, jsonOptions);
                    if (reqModif == null || string.IsNullOrEmpty(reqModif.IdProveedor))
                    {
                        logger.LogWarning("⚠️ [FondosHandler] No se pudo obtener IdProveedor de ModificarFondoRequest.");
                        return;
                    }

                    if(fondoAntiguo == null)
                    {
                        logger.LogWarning("⚠️ [FondosHandler] No se pudo obtener fondo antiguo");
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
                        { "ValorFondo", fondoAntiguo.ValorFondo?.ToString("N2") },
                        { "ValorFondoLetras", this.ConvertirDecimalAPalabras((decimal)fondoAntiguo.ValorFondo) },
                        { "NuevoValorFondo", reqModif.ValorFondo.ToString("N2") },
                        { "NuevoValorFondoLetras", this.ConvertirDecimalAPalabras(reqModif.ValorFondo) },
                        { "FechaInicio", fondoAntiguo.FechaInicioVigencia.ToString() },
                        { "NuevaFechaInicio", reqModif.FechaInicioVigencia.ToString() },
                        { "FechaFin", fondoAntiguo.FechaInicioVigencia.ToString() },
                        { "NuevaFechaFin", reqModif.FechaInicioVigencia.ToString() },
                        { "ValorDisponible", fondoAntiguo.ValorDisponible?.ToString("N2") },
                        { "NuevoValorDisponible", reqModif.ValorFondo.ToString("N2") },
                        { "ValorComprometido", fondoAntiguo.ValorComprometido?.ToString("N2") },
                        { "NuevoValorComprometido", "0" },
                        { "ValorLiquidado", fondoAntiguo.ValorLiquidado?.ToString("N2") },
                        { "NuevoValorLiquidado", "0" },
                        { "Firma", reqModif.NombreUsuarioModifica },
                    };
                    break;


                case TipoProceso.Aprobacion:
                    var reqAprobacion = JsonSerializer.Deserialize<AprobarFondoRequest>(requestBody, jsonOptions);
                    if (reqAprobacion == null || reqAprobacion.Identidad ==null)
                    {
                        logger.LogWarning("⚠️ [FondosHandler] No se pudo obtener Identidad de AprobarFondoRequest.");
                        return;
                    }

                    string estadoCorreo = reqAprobacion.IdEtiquetaEstado switch
                    {
                        "ESTADOAPROBADO" => "APROBADO",
                        "ESTADONEGADO" => "NEGADO"
                    };

                    var fondo = await fondoRepo.ObtenerPorIdAsync((int)reqAprobacion.Identidad);

                    if (fondo == null)
                    {
                        logger.LogWarning($"no se encontro el fondo con el id: {reqAprobacion.Identidad}");
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
                            { "ValorFondo", fondo.ValorFondo?.ToString("N2") },
                            { "ValorFondoLetras", this.ConvertirDecimalAPalabras((decimal)fondo.ValorFondo) },
                            { "FechaInicio", fondo.FechaInicioVigencia.ToString() },
                            { "FechaFin", fondo.FechaFinVigencia.ToString() },
                            { "Firma", reqAprobacion.UsuarioAprobador },
                            { "Estado", estadoCorreo },
                        };
                    break;

                    
                case TipoProceso.Inactivacion:
                    var reqInactivacion = JsonSerializer.Deserialize<InactivarFondoRequest>(requestBody, jsonOptions);
                    if (reqInactivacion == null || reqInactivacion.IdFondo == null)
                    {
                        logger.LogWarning("⚠️ [FondosHandler] No se pudo obtener Identidad de AprobarFondoRequest.");
                        return;
                    }

                    
                    var fondo2 = await fondoRepo.ObtenerPorIdAsync((int)reqInactivacion.IdFondo);

                    if (fondo2 == null)
                    {
                        logger.LogWarning($"no se encontro el fondo con el id: {reqInactivacion.IdFondo}");
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
                            { "ValorFondo", fondo2.ValorFondo?.ToString("N2") },
                            { "ValorFondoLetras", this.ConvertirDecimalAPalabras((decimal)fondo2.ValorFondo) },
                            { "FechaInicio", fondo2.FechaInicioVigencia.ToString() },
                            { "FechaFin", fondo2.FechaFinVigencia.ToString() },
                            { "ValorDisponible", fondo2.ValorDisponible?.ToString("N2") },
                            { "ValorComprometido", fondo2.ValorComprometido?.ToString("N2") },
                            { "ValorLiquidado", fondo2.ValorLiquidado?.ToString("N2") },
                            { "Firma", reqInactivacion.NombreUsuarioIngreso },
                            // { "OtroCampoDeCreacion", reqCreacion.OtroCampo } // Ejemplo
                        };
                    
                    break;

                default:
                    logger.LogWarning($"[FondosHandler] TipoProceso no reconocido o sin estrategia definida: {tipoProceso}.");
                    return;
            }

            // 3. A partir de aquí, la lógica es común y ya tiene los datos correctos
            //    (IdProveedor y camposPlantilla) sin importar qué 'case' se ejecutó.

            if (camposPlantilla != null)
            {
                await this.EnviarCorreo(entidad, tipoProcEtiqueta, IdProveedor, tipoProceso, camposPlantilla, "Fondos");
            }
            else
            {
                logger.LogWarning($"[FondosHandler] campos para plantilla de email no definido");
            }
        }


    }
}
