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
        public Task SendEmailAsync(List<string> toList, string subject, string templateName, Dictionary<string, string> placeholders, List<string>? ccList = null, List<string>? bccList = null)
            => repo.SendEmailAsync(toList,subject, templateName, placeholders, ccList, bccList);
    }
}
