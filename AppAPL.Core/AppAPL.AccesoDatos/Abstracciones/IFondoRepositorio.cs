

using AppAPL.Dto;
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
        Task<ControlErroresDTO> ActualizarAsync(ActualizarFondoRequest fondo, int idFondo);
        Task<ControlErroresDTO> AprobarFondo(AprobarFondoRequest fondo);
        Task CrearAsync(CrearFondoRequest fondo);
        Task EliminarAsync(int idFondo);
        Task<IEnumerable<BandejaAprobacionDTO>> ObtenerBandejaAprobacion(string usuarioAprobador);
        Task<BandejaAprobacionDTO?> ObtenerBandejaAprobacionPorId(int idFondo, int idAprobacion);
        Task<IEnumerable<BandejaFondoDTO>> ObtenerBandejaInactivacion();
        Task<IEnumerable<BandejaFondoDTO>> ObtenerBandejaModificacion();
        Task<BandejaFondoDTO?> ObtenerBandejaModificacionPorId(int idFondo);
        Task<IEnumerable<FondoDTO>> ObtenerFondosAsync();
        Task<FondoDTO?> ObtenerPorIdAsync(int idFondo);
    }
}
