using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Api.Attributes;
using AppAPL.Api.Handlers.Interfaces;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Email;
using AppAPL.Dto.Fondos;
using System.Text.Json;

namespace AppAPL.Api.Handlers
{
    public class AcuerdosEmailHandler (IEmailRepositorio emailRepo, ILogger<AcuerdosEmailHandler> logger) : HandlerBase(emailRepo, logger), IAcuerdosEmailHandler
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
            string IdProveedor;
            Dictionary<string, string> camposPlantilla = null;

            switch (tipoProceso)
            {
                case TipoProceso.Creacion:
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

                //await this.EnviarCorreo(entidad, tipoProcEtiqueta, IdProveedor, tipoProceso, camposPlantilla);
            }
    }
}
