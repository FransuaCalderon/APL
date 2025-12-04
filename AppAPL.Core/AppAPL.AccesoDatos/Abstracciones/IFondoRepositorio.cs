

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
        Task<ControlErroresDTO> CrearAsync(CrearFondoRequest fondo);
        Task EliminarAsync(int idFondo);
        Task<ControlErroresDTO> InactivarFondo(InactivarFondoRequest fondo);
       
        Task<IEnumerable<BandejaAprobacionDTO>> ObtenerBandejaAprobacion(string usuarioAprobador);
        Task<BandejaAprobacionDTO?> ObtenerBandejaAprobacionPorId(int idFondo, int idAprobacion);
        Task<IEnumerable<BandejaFondoDTO>> ObtenerBandejaInactivacion();
        Task<IEnumerable<BandejaFondoDTO>> ObtenerBandejaModificacion();
        Task<BandejaFondoDTO?> ObtenerBandejaModificacionPorId(int idFondo);
        Task<IEnumerable<FondoDTO>> ObtenerFondosAsync(string? NombreUsuario = null, int? IdOpcion = null, string? IdControlInterfaz = null,
             string? IdEvento = null);
        Task<FondoDTO?> ObtenerPorIdAsync(int idFondo);
    }
}
