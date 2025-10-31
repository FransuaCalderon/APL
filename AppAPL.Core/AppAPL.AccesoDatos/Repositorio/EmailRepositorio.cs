using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Text;
namespace AppAPL.AccesoDatos.Repositorio
{
    public class EmailRepositorio (IConfiguration config, IWebHostEnvironment env) : IEmailRepositorio
    {
        public async Task SendEmailAsync(List<string> toList, string subject, string templateName, Dictionary<string, string> placeholders, List<string>? ccList = null, List<string>? bccList = null)
        {
            //Cargar la plantilla HTML
            var templatePath = Path.Combine(env.ContentRootPath, "EmailTemplates", templateName);
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
            await smtp.ConnectAsync(
            config["EmailSettings:SmtpServer"],
            int.Parse(config["EmailSettings:Port"]),
            SecureSocketOptions.StartTls
            );
            await smtp.AuthenticateAsync(
            config["EmailSettings:Username"],
            config["EmailSettings:Password"]
            );
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}
