using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.Dto.Email;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IEmailRepositorio
    {
        Task<IEnumerable<DatosCorreoDTO>> ObtenerDatosCorreo(ConsultarDatosCorreoRequest request);
        Task SendEmailAsync(List<string> toList, string subject, string templateName, Dictionary<string, string> placeholders, List<string>? ccList = null, List<string>? bccList = null);
    }
}
