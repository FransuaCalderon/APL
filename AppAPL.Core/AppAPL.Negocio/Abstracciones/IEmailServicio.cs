using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IEmailServicio
    {
        Task SendEmailAsync(List<string> toList, string subject, string templateName, Dictionary<string, string> placeholders, List<string>? ccList = null, List<string>? bccList = null);
    }
}
