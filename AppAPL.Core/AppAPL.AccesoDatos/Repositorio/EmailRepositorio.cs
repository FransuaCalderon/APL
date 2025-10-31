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
        public async Task SendEmailAsync(string to, string subject, string templateName, Dictionary<string, string> placeholders)
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
            email.To.Add(MailboxAddress.Parse(to));
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
