using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using AppAPL.Dto.Email;
using Dapper;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MimeKit.Text;
using Oracle.ManagedDataAccess.Client;
namespace AppAPL.AccesoDatos.Repositorio
{
    public class EmailRepositorio (IConfiguration config, IWebHostEnvironment env, OracleConnectionFactory factory, ILogger<EmailRepositorio> logger) : IEmailRepositorio
    {
        /*
        public async Task SendEmailAsync(List<string> toList, string subject, string templateName, Dictionary<string, string> placeholders, List<string>? ccList = null, List<string>? bccList = null)
        {
            //Cargar la plantilla HTML
            var templatePath = Path.Combine(env.ContentRootPath, "EmailTemplates", templateName);

            // --- MANEJO SIN TRY-CATCH ---
            // Verificar si el archivo existe ANTES de leerlo.
            if (!File.Exists(templatePath))
            {
                
                logger.LogWarning($"No se pudo encontrar la plantilla de email: {templateName} en la ruta {templatePath}");

                return; // Termina la ejecución del método aquí.
            }

            var htmlBody = await File.ReadAllTextAsync(templatePath);

            //Reemplazar los placeholders {{Nombre}}  valores
            foreach (var placeholder in placeholders)
            {
                htmlBody = htmlBody.Replace("{{" + placeholder.Key + "}}", placeholder.Value);
            }

            //onstruir el mensaje MIME
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(
            config["EmailSettings:FromName"],
            config["EmailSettings:FromEmail"]
            ));



            //  Agregar múltiples destinatarios
            foreach (var to in toList)
            {
                email.To.Add(MailboxAddress.Parse(to));
            }

            // CC (opcional)
            if (ccList != null)
            {
                foreach (var cc in ccList)
                    email.Cc.Add(MailboxAddress.Parse(cc));
            }

            // BCC (opcional)
            if (bccList != null)
            {
                foreach (var bcc in bccList)
                    email.Bcc.Add(MailboxAddress.Parse(bcc));
            }


            email.Subject = subject;
            email.Body = new TextPart(TextFormat.Html) { Text = htmlBody };

            //Enviar el correo
            using var smtp = new SmtpClient();
            smtp.Timeout = 30000; // 30 segundos


            await smtp.ConnectAsync(
            config["EmailSettings:SmtpServer"],
            int.Parse(config["EmailSettings:Port"]),
            SecureSocketOptions.SslOnConnect
            );
            await smtp.AuthenticateAsync(
            config["EmailSettings:Username"],
            config["EmailSettings:Password"]
            );
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
        */


        public async Task SendEmailAsync(List<string> toList, string subject, string templateName, Dictionary<string, string> placeholders, List<string>? ccList = null, List<string>? bccList = null)
        {
            // 1. Identificar qué configuración usar del JSON
            string provider = config["EmailProvider"] ?? "Gmail";
            var settings = config.GetSection($"EmailSettings:{provider}");

            var templatePath = Path.Combine(env.ContentRootPath, "EmailTemplates", templateName);

            if (!File.Exists(templatePath))
            {
                logger.LogWarning($"No se pudo encontrar la plantilla: {templateName}");
                return;
            }

            var htmlBody = await File.ReadAllTextAsync(templatePath);
            foreach (var placeholder in placeholders)
            {
                htmlBody = htmlBody.Replace("{{" + placeholder.Key + "}}", placeholder.Value);
            }

            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(settings["FromName"], settings["FromEmail"]));

            foreach (var to in toList) email.To.Add(MailboxAddress.Parse(to));
            if (ccList != null) foreach (var cc in ccList) email.Cc.Add(MailboxAddress.Parse(cc));
            if (bccList != null) foreach (var bcc in bccList) email.Bcc.Add(MailboxAddress.Parse(bcc));

            email.Subject = subject;
            email.Body = new TextPart(TextFormat.Html) { Text = htmlBody };

            using var smtp = new SmtpClient();
            smtp.Timeout = 30000;

            // 2. Configuración de Seguridad Dinámica
            bool useSsl = bool.Parse(settings["UseSSL"] ?? "false");
            var security = useSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.None;

            await smtp.ConnectAsync(
                settings["SmtpServer"],
                int.Parse(settings["Port"] ?? "25"),
                security
            );

            // 3. Autenticación Dinámica (si hay usuario, lo usa; si no, lo salta)
            string? user = settings["Username"];
            string? pass = settings["Password"];

            if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
            {
                await smtp.AuthenticateAsync(user, pass);
            }

            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }

        public async Task<IEnumerable<DatosCorreoDTO>> ObtenerDatosCorreo(ConsultarDatosCorreoRequest request)
        {
            using var connection = factory.CreateOpenConnection();


            // 🔹 Inicializar OracleDynamicParameters con objeto anónimo
            var paramObject = new 
            {
                p_entidad = request.Entidad.ToUpper(),
                p_tproceso = request.TipoProceso.ToUpper(),
                p_iddocumento = request.IdDocumento
            };

            var parameters = new OracleDynamicParameters(paramObject);

            // 🔹 Agregar los parámetros de salida
            parameters.Add("p_cursor", OracleDbType.RefCursor, ParameterDirection.Output);
            parameters.Add("p_codigo_salida", OracleDbType.Int32, ParameterDirection.InputOutput, value: 0);
            parameters.Add("p_mensaje_salida", OracleDbType.Varchar2, ParameterDirection.InputOutput, value: "", size: 250);

            // 🔹 Ejecutar el SP
            var datos = await connection.QueryAsync<DatosCorreoDTO>(
                "apl_sp_datos_correo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            int? codigoSalida = parameters.Get<int>("p_codigo_salida");
            string? mensajeSalida = parameters.Get<string>("p_mensaje_salida");

            logger.LogInformation($"codigoSalida: {codigoSalida}, mensajeSalida: {mensajeSalida}");

            return datos;
        }
    }
}
