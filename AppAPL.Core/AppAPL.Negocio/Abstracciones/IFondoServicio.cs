
using AppAPL.Dto;
using AppAPL.Dto.Fondos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IFondoServicio
    {
        Task<ControlErroresDTO> ActualizarAsync(ActualizarFondoRequest fondo, int idFondo);
        Task<ControlErroresDTO> CrearAsync(CrearFondoRequest fondo);
        Task EliminarAsync(int idFondo);
        Task<IEnumerable<FondoDTO>> ListarAsync();
        Task<FondoDTO?> ObtenerPorIdAsync(int idFondo);
        Task<IEnumerable<BandejaFondoDTO>> ObtenerBandejaModificacion();
        Task<BandejaFondoDTO?> ObtenerBandejaModificacionPorId(int idFondo);
        Task<IEnumerable<BandejaFondoDTO>> ObtenerBandejaInactivacion();
        Task<IEnumerable<BandejaAprobacionDTO>> ObtenerBandejaAprobacion(string usuarioAprobador);
        Task<BandejaAprobacionDTO?> ObtenerBandejaAprobacionPorId(int idFondo, int idAprobacion);
        Task<ControlErroresDTO> AprobarFondo(AprobarFondoRequest fondo);
    }
}
