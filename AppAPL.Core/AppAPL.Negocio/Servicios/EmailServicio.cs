using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Negocio.Abstracciones;

namespace AppAPL.Negocio.Servicios
{
    public class EmailServicio (IEmailRepositorio repo) : IEmailServicio
    {
        public Task SendEmailAsync(string to, string subject, string templateName, Dictionary<string, string> placeholders)
            => repo.SendEmailAsync(to,subject, templateName, placeholders);
    }
}
