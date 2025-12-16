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
        public async Task HandleAsync(string entidad, TipoProceso tipoProceso, string requestBody, AcuerdoDTO? acuerdoAntiguo = null, string? responseBody = null)
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
            string IdProveedor = "";
            Dictionary<string, string> camposPlantilla = null;

            logger.LogInformation($"[AcuerdosHandler] Enviando correo para proceso: {tipoProceso}.");

            switch (tipoProceso)
            {
                case TipoProceso.Creacion:
                    var reqCreacion = JsonSerializer.Deserialize<CrearActualizarAcuerdoGrupoDTO>(requestBody, jsonOptions);
                    if (reqCreacion == null)
                    {
                        logger.LogWarning("⚠️ [FondosHandler] No se pudo deserializar body de Crear Acuerdo");
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
                    var proveedor = await proveedorRepo.ObtenerPorIdAsync(IdProveedor);

                    if (proveedor == null)
                    {
                        logger.LogWarning($"no se encontro proveedor con el idproveedor: {IdProveedor}");
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
                        { "ValorAcuerdo", reqCreacion.Fondo.ValorAporte.ToString() },
                        { "ValorAcuerdoLetras", this.ConvertirDecimalAPalabras(reqCreacion.Fondo.ValorAporte) },
                        { "FechaInicio", reqCreacion.Acuerdo.FechaInicioVigencia.ToString() },
                        { "FechaFin", reqCreacion.Acuerdo.FechaFinVigencia.ToString() },
                        { "IdFondo", reqCreacion.Fondo.IdFondo.ToString() },
                        { "TipoFondo", catalogo.Nombre },
                        { "Firma", "" },
                        // { "OtroCampoDeCreacion", reqCreacion.OtroCampo } // Ejemplo
                    };

                    
                    break;

                case TipoProceso.Modificacion:
                    /*
                    camposPlantilla = new Dictionary<string, string>
                        {
                            { "Nombre", "" },
                            { "IdAcuerdo", "" },
                            { "NombreProveedor", "" },
                            { "NuevoNombreProveedor", "" },
                            { "ValorAcuerdo", "" },
                            { "ValorAcuerdoLetras", "" },
                            { "NuevoValorAcuerdo", "" },
                            { "NuevoValorAcuerdoLetras", "" },
                            { "FechaInicio", "" },
                            { "NuevaFechaInicio", "" },
                            { "FechaFin", "" },
                            { "NuevaFechaFin", "" },

                            { "ValorDisponible", "" },
                            { "NuevoValorDisponible", "" },
                            { "ValorComprometido", "" },
                            { "NuevoValorComprometido", "" },
                            { "ValorLiquidado", "" },
                            { "NuevoValorLiquidado", "" },

                            { "IdFondoAnterior", "" },
                            { "IdFondoActual", "" },

                            { "Firma", "" },

                        };*/

                    break;

                case TipoProceso.Aprobacion:
                    var reqAprobacion = JsonSerializer.Deserialize<AprobarAcuerdoRequest>(requestBody, jsonOptions);
                    if (reqAprobacion == null || reqAprobacion.Identidad == null)
                    {
                        logger.LogWarning("⚠️ [FondosHandler] No se pudo obtener Identidad de AprobarFondoRequest.");
                        return;
                    }

                    string estadoCorreo = reqAprobacion.IdEtiquetaEstado switch
                    {
                        "ESTADOAPROBADO" => "APROBADO",
                        "ESTADONEGADO" => "NEGADO"
                    };

                    var acuerdo = await acuerdoRepo.ObtenerPorIdAsync((int)reqAprobacion.Identidad);
                    if (acuerdo == null)
                    {
                        logger.LogWarning($"no se encontro el acuerdo con el idacuerdo: {reqAprobacion.Identidad}");
                        return;
                    }

                    var acuerdoFondo = await acuerdoRepo.ObtenerAcuerdoFondoPorIdAsync((int)reqAprobacion.Identidad);
                    if (acuerdoFondo == null)
                    {
                        logger.LogWarning($"no se encontro el acuerdo fondo con el idacuerdo: {reqAprobacion.Identidad}");
                        return;
                    }

                    
                    var fondo2 = await fondoRepo.ObtenerPorIdAsync(acuerdoFondo.IdFondo);
                    if (fondo2 == null)
                    {
                        logger.LogWarning($"no se encontro el fondo con el id: {acuerdoFondo.IdFondo}");
                        return;
                    }

                    IdProveedor = fondo2.IdProveedor;
                    var proveedor2 = await proveedorRepo.ObtenerPorIdAsync(IdProveedor);

                    if (proveedor2 == null)
                    {
                        logger.LogWarning($"no se encontro proveedor con el idproveedor: {IdProveedor}");
                        return;
                    }

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
                            { "IdAcuerdo", reqAprobacion.Identidad.ToString() },
                            { "NombreProveedor", proveedor2.Nombre },
                            
                            { "ValorAcuerdo", acuerdoFondo.ValorAporte.ToString() },
                            { "ValorAcuerdoLetras", this.ConvertirDecimalAPalabras(acuerdoFondo.ValorAporte) },
                            { "FechaInicio", acuerdo.FechaInicioVigencia.ToString() },
                            { "FechaFin", acuerdo.FechaFinVigencia.ToString() },
                            { "IdFondo", fondo2.IdFondo.ToString() },
                            { "TipoFondo", catalogo2.Nombre },
                            { "Firma", "" },
                            
                        };
                    break;

                case TipoProceso.Inactivacion:
                    /*
                    camposPlantilla = new Dictionary<string, string>
                        {
                            { "Nombre", "" },
                            { "IdAcuerdo", "" },
                            { "NombreProveedor", "" },

                            { "ValorAcuerdo", "" },
                            { "ValorAcuerdoLetras", "" },
                            { "ValorDisponibleAcuerdo", "" },
                            { "ValorDisponibleAcuerdoLetras", "" },
                            { "FechaInicio", "" },
                            { "FechaFin", "" },
                            { "IdFondo", "" },
                            { "ValorDisponibleFondo", "" },
                            { "Firma", "" },

                        };
                    */
                    break;

                default:
                    
                    return;
            }

            if (camposPlantilla != null)
            {
                await this.EnviarCorreo(entidad, tipoProcEtiqueta, IdProveedor, tipoProceso, camposPlantilla, "Acuerdos");
            }
            else
            {
                logger.LogWarning($"[AcuerdosHandler] campos para plantilla de email no definido");
            }
                
        }
    }
}
