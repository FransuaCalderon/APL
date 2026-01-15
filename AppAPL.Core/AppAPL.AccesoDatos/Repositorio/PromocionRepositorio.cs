using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.AccesoDatos.Oracle;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Repositorio
{
    public class PromocionRepositorio (OracleConnectionFactory factory, ILogger<PromocionRepositorio> logger) : IPromocionRepositorio
    {

    }
}
