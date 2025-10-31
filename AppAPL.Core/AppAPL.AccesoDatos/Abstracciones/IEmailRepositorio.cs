using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IEmailRepositorio
    {
        Task SendEmailAsync(string to, string subject, string templateName, Dictionary<string, string> placeholders);
    }
}
