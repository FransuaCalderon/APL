﻿

using AppAPL.Dto.Fondos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IFondoRepositorio
    {
        Task ActualizarAsync(CrearActualizarFondoRequest fondo, int idFondo);
        Task<int> CrearAsync(CrearActualizarFondoRequest fondo);
        Task EliminarAsync(int idFondo);
        Task<IEnumerable<FondoDTO>> ObtenerFondosAsync();

    }
}
