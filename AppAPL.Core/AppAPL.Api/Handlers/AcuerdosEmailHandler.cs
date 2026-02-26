using System.Text.Json;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Api.Handlers.Interfaces;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Email;
using AppAPL.Dto.Fondos;

namespace AppAPL.Api.Handlers
{
    public class AcuerdosEmailHandler (IEmailRepositorio emailRepo, ILogger<AcuerdosEmailHandler> logger,
        IFondoRepositorio fondoRepo, IProveedorRepositorio proveedorRepo, ICatalogoRepositorio catalogoRepo,
        IAcuerdoRepositorio acuerdoRepo) : HandlerBase(emailRepo, logger), IAcuerdosEmailHandler
    {
        public async Task HandleAsync(string entidad, TipoProceso tipoProceso, string requestBody, BandConsAcuerdoPorIDDTO? acuerdoAntiguo = null, string? responseBody = null)
        {

            logger.LogInformation($"[AcuerdosHandler] Procesando correo. Entidad={entidad}, TipoProceso={tipoProceso}");

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
            //List<string> proveedores = new List<string>();
            string IdProveedor = "";
            Dictionary<string, string> camposPlantilla = null;
            string notificacion = "";

            logger.LogInformation($"[AcuerdosHandler] Enviando correo para proceso: {tipoProceso}.");

            switch (tipoProceso)
            {
                case TipoProceso.Creacion:
                    var reqCreacion = JsonSerializer.Deserialize<CrearAcuerdoGrupoDTO>(requestBody, jsonOptions);
                    if (reqCreacion == null)
                    {
                        logger.LogWarning("⚠️ [AcuerdosHandler] No se pudo deserializar body de Crear Acuerdo");
                        return;
                    }

                    var retorno = JsonSerializer.Deserialize<ControlErroresDTO>(responseBody, jsonOptions);
                    if (retorno == null)
                    {
                        logger.LogWarning("No existe Response body");
                        return;
                    }


                    var fondo = await fondoRepo.ObtenerPorIdAsync(reqCreacion.Fondo.IdFondo);
                    if (fondo == null)
                    {
                        logger.LogWarning($"no se encontro el fondo con el id: {reqCreacion.Fondo.IdFondo}");
                        return;
                    }

                    IdProveedor = fondo.IdProveedor;
                    //proveedores.Add(fondo.IdProveedor);
                    var proveedor = await proveedorRepo.ObtenerPorIdAsync(fondo.IdProveedor);

                    if (proveedor == null)
                    {
                        logger.LogWarning($"no se encontro proveedor con el idproveedor: {fondo.IdProveedor}");
                        return;
                    }

                    var catalogo = await catalogoRepo.ObtenerPorIdAsync((int)fondo.IdTipoFondo);
                    if (catalogo == null)
                    {
                        logger.LogWarning($"no se encontro catalogo con el idTipoFondo: {fondo.IdTipoFondo}");
                        return;
                    }

                    camposPlantilla = new Dictionary<string, string>
                    {
                        { "Nombre", "" },
                        { "IdAcuerdo", retorno.Id.ToString() },
                        { "NombreProveedor", proveedor.Nombre },
                        { "ValorAcuerdo", this.FormatearAMoneda(reqCreacion.Fondo.ValorAporte) },
                        { "ValorAcuerdoLetras", this.ConvertirDecimalAPalabras(reqCreacion.Fondo.ValorAporte) },
                        { "FechaInicio", reqCreacion.Acuerdo.FechaInicioVigencia.ToString() },
                        { "FechaFin", reqCreacion.Acuerdo.FechaFinVigencia.ToString() },
                        { "IdFondo", reqCreacion.Fondo.IdFondo.ToString() },
                        { "TipoFondo", catalogo.Nombre },
                        { "Firma", "" },
                        // { "OtroCampoDeCreacion", reqCreacion.OtroCampo } // Ejemplo
                    };
                    notificacion = $"apl solicitud {tipoProceso} acuerdo".ToUpper();

                    break;

                case TipoProceso.Modificacion:
                    var reqModificacion = JsonSerializer.Deserialize<ActualizarAcuerdoDTO>(requestBody, jsonOptions);
                    if (reqModificacion == null)
                    {
                        logger.LogWarning("⚠️ [AcuerdosHandler] No se pudo deserializar body de Crear Acuerdo");
                        return;
                    }

                    if (acuerdoAntiguo == null)
                    {
                        logger.LogWarning("⚠️ [AcuerdosHandler] No se pudo obtener acuerdo antiguo");
                        return;
                    }

                    var fondoNuevo = await fondoRepo.ObtenerPorIdAsync(reqModificacion.IdFondo);
                    if (fondoNuevo == null)
                    {
                        logger.LogWarning($"no se encontro el fondo con el id: {reqModificacion.IdFondo}");
                        return;
                    }

                    var fondoAntiguo = await fondoRepo.ObtenerPorIdAsync(acuerdoAntiguo.cabecera.idfondo);
                    if (fondoAntiguo == null)
                    {
                        logger.LogWarning($"no se encontro el fondo con el id: {acuerdoAntiguo.cabecera.idfondo}");
                        return;
                    }

                    var proveedorAntiguo = await proveedorRepo.ObtenerPorIdAsync(fondoAntiguo.IdProveedor);
                    var proveedorNuevo = await proveedorRepo.ObtenerPorIdAsync(fondoNuevo.IdProveedor);

                    if (proveedorAntiguo == null || proveedorNuevo == null)
                    {
                        logger.LogWarning($"no se encontro proveedores, proveedorAntiguo: {fondoAntiguo.IdProveedor}, proveedorNuevo:  {fondoNuevo.IdProveedor}");
                        return;
                    }


                    camposPlantilla = new Dictionary<string, string>
                        {
                            { "Nombre", "" },
                            { "IdAcuerdo", reqModificacion.IdAcuerdo.ToString() },
                            { "NombreProveedor", proveedorAntiguo.Nombre },
                            { "NuevoNombreProveedor", proveedorNuevo.Nombre },
                            { "ValorAcuerdo", this.FormatearAMoneda(acuerdoAntiguo.cabecera.valor_total) },
                            { "ValorAcuerdoLetras", this.ConvertirDecimalAPalabras(acuerdoAntiguo.cabecera.valor_total) },
                            { "NuevoValorAcuerdo", this.FormatearAMoneda(reqModificacion.ValorAporte) },
                            { "NuevoValorAcuerdoLetras", this.ConvertirDecimalAPalabras(reqModificacion.ValorAporte) },
                            { "FechaInicio", acuerdoAntiguo.cabecera.fecha_inicio.ToString() },
                            { "NuevaFechaInicio", reqModificacion.FechaInicioVigencia.ToString() },
                            { "FechaFin", acuerdoAntiguo.cabecera.fecha_fin.ToString() },
                            { "NuevaFechaFin", reqModificacion.FechaFinVigencia.ToString() },

                            { "ValorDisponible", this.FormatearAMoneda(acuerdoAntiguo.cabecera.valor_disponible) },
                            { "NuevoValorDisponible", this.FormatearAMoneda(reqModificacion.ValorAporte) },
                            { "ValorComprometido", this.FormatearAMoneda(acuerdoAntiguo.cabecera.valor_comprometido) },
                            { "NuevoValorComprometido", "0.00" },
                            { "ValorLiquidado", this.FormatearAMoneda(acuerdoAntiguo.cabecera.valor_liquidado) },
                            { "NuevoValorLiquidado", "0.00" },

                            { "IdFondoAnterior", fondoAntiguo.IdFondo.ToString() },
                            { "IdFondoActual", fondoNuevo.IdFondo.ToString() },

                            { "Firma", "" },

                        };

                    notificacion = $"apl solicitud {tipoProceso} acuerdo".ToUpper();
                    break;

                case TipoProceso.Aprobacion:
                    var reqAprobacion = JsonSerializer.Deserialize<AprobarAcuerdoRequest>(requestBody, jsonOptions);
                    if (reqAprobacion == null || reqAprobacion.Identidad == null)
                    {
                        logger.LogWarning("⚠️ [AcuerdosHandler] No se pudo obtener Identidad de AprobarFondoRequest.");
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

                    var acuerdo = await acuerdoRepo.ObtenerBandejaConsultaPorId((int)reqAprobacion.Identidad);
                    if (acuerdo == null)
                    {
                        logger.LogWarning($"no se encontro el acuerdo con el idacuerdo: {reqAprobacion.Identidad}");
                        return;
                    }

                    
                    var fondo2 = await fondoRepo.ObtenerPorIdAsync(acuerdo.cabecera.idfondo);
                    if (fondo2 == null)
                    {
                        logger.LogWarning($"no se encontro el fondo con el id: {acuerdo.cabecera.idfondo}");
                        return;
                    }

                    IdProveedor = fondo2.IdProveedor;
                    //proveedores.Add(fondo2.IdProveedor);

                    var catalogo2 = await catalogoRepo.ObtenerPorIdAsync((int)fondo2.IdTipoFondo);
                    if (catalogo2 == null)
                    {
                        logger.LogWarning($"no se encontro catalogo con el idTipoFondo: {fondo2.IdTipoFondo}");
                        return;
                    }

                    camposPlantilla = new Dictionary<string, string>
                        {
                            { "Nombre", "" },
                            { "Estado", estadoCorreo },
                            { "TipoProceso", etiquetaTipoProceso },
                            { "IdAcuerdo", reqAprobacion.Identidad.ToString() },
                            { "NombreProveedor", acuerdo.cabecera.fondo_proveedor },
                            
                            { "ValorAcuerdo", this.FormatearAMoneda(acuerdo.cabecera.valor_total) },
                            { "ValorAcuerdoLetras", this.ConvertirDecimalAPalabras(acuerdo.cabecera.valor_total) },
                            { "FechaInicio", acuerdo.cabecera.fecha_inicio.ToString() },
                            { "FechaFin", acuerdo.cabecera.fecha_fin.ToString() },
                            { "IdFondo", acuerdo.cabecera.idfondo.ToString() },
                            { "TipoFondo", catalogo2.Nombre },
                            { "Firma", "" },
                            
                        };

                    notificacion = $"apl solicitud {tipoProceso} acuerdo".ToUpper();
                    break;

                case TipoProceso.Inactivacion:
                    var reqInactivacion = JsonSerializer.Deserialize<InactivarAcuerdoRequest>(requestBody, jsonOptions);
                    if (reqInactivacion == null || reqInactivacion.IdAcuerdo == null)
                    {
                        logger.LogWarning("⚠️ [AcuerdosHandler] No se pudo obtener Identidad de AprobarFondoRequest.");
                        return;
                    }

                    var acuerdo2 = await acuerdoRepo.ObtenerBandejaConsultaPorId(reqInactivacion.IdAcuerdo);
                    if (acuerdo2 == null)
                    {
                        logger.LogWarning($"no se encontro el acuerdo con el idacuerdo: {reqInactivacion.IdAcuerdo}");
                        return;
                    }

                    var fondo3 = await fondoRepo.ObtenerPorIdAsync(acuerdo2.cabecera.idfondo);

                    if (fondo3 == null)
                    {
                        logger.LogWarning($"no se encontro el fondo con el id: {acuerdo2.cabecera.idfondo}");
                    }

                    IdProveedor = fondo3.IdProveedor;
                    //proveedores.Add(fondo3.IdProveedor);


                    camposPlantilla = new Dictionary<string, string>
                        {
                            { "Nombre", "" },
                            { "IdAcuerdo", acuerdo2.cabecera.idacuerdo.ToString() },
                            { "NombreProveedor", acuerdo2.cabecera.fondo_proveedor },

                            { "ValorAcuerdo", this.FormatearAMoneda(acuerdo2.cabecera.valor_total) },
                            { "ValorAcuerdoLetras", this.ConvertirDecimalAPalabras(acuerdo2.cabecera.valor_total) },
                            { "ValorDisponibleAcuerdo", this.FormatearAMoneda(acuerdo2.cabecera.valor_disponible) },
                            { "ValorDisponibleAcuerdoLetras", this.ConvertirDecimalAPalabras(acuerdo2.cabecera.valor_disponible) },
                            { "FechaInicio", acuerdo2.cabecera.fecha_inicio.ToString() },
                            { "FechaFin", acuerdo2.cabecera.fecha_fin.ToString() },
                            { "IdFondo", acuerdo2.cabecera.idfondo.ToString() },
                            { "ValorDisponibleFondo", this.FormatearAMoneda((decimal)fondo3.ValorFondo) },
                            { "Firma", "" },

                        };

                    notificacion = $"apl solicitud {tipoProceso} acuerdo".ToUpper();

                    break;

                default:
                    logger.LogWarning($"[AcuerdosHandler] TipoProceso no reconocido o sin estrategia definida: {tipoProceso}.");
                    return;
            }

            if (camposPlantilla != null)
            {
                await this.EnviarCorreo(entidad, tipoProcEtiqueta, IdProveedor, tipoProceso, camposPlantilla, notificacion);
            }
            else
            {
                logger.LogWarning($"[AcuerdosHandler] campos para plantilla de email no definido");
            }
                
        }
    }
}
