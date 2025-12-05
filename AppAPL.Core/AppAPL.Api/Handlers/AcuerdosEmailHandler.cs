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
        IFondoRepositorio fondoRepo, IProveedorRepositorio proveedorRepo, ICatalogoRepositorio catalogoRepo) : HandlerBase(emailRepo, logger, catalogoRepo), IAcuerdosEmailHandler
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

                    logger.LogInformation($"[AcuerdosHandler] Enviando correo para proceso: {tipoProceso}.");
                    break;

                case TipoProceso.Modificacion:
                    logger.LogInformation($"[AcuerdosHandler] Enviando correo para proceso: {tipoProceso}.");
                    break;

                case TipoProceso.Aprobacion:
                    logger.LogInformation($"[AcuerdosHandler] Enviando correo para proceso: {tipoProceso}.");
                    break;

                case TipoProceso.Inactivacion:
                    logger.LogInformation($"[AcuerdosHandler] Enviando correo para proceso: {tipoProceso}.");
                    break;

                default:
                    logger.LogWarning($"[AcuerdosHandler] TipoProceso no reconocido o sin estrategia definida: {tipoProceso}.");
                    return;
            }

            if (camposPlantilla != null)
            {
                await this.EnviarCorreo(entidad, tipoProcEtiqueta, IdProveedor, tipoProceso, camposPlantilla);
            }
            else
            {
                logger.LogWarning($"[AcuerdosHandler] campos para plantilla de email no definido");
            }
                
        }
    }
}
