using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IEmailServicio
    {
        Task SendEmailAsync(string to, string subject, string templateName, Dictionary<string, string> placeholders);
    }
}
