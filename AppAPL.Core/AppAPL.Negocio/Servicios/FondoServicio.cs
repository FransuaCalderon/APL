using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Servicios
{
    public class FondoServicio(IFondoRepositorio repo) : IFondoServicio
    {
        public async Task<IEnumerable<FondoDTO>> ListarAsync()
            => await repo.ObtenerFondosAsync();

        public async Task<FondoDTO?> ObtenerPorIdAsync(int idFondo)
            => await repo.ObtenerPorIdAsync(idFondo);

        public async Task CrearAsync(CrearFondoRequest fondo)
            => await repo.CrearAsync(fondo);

        public async Task<ControlErroresDTO> ActualizarAsync(ActualizarFondoRequest fondo, int idFondo)
            => await repo.ActualizarAsync(fondo, idFondo);

        public async Task EliminarAsync(int idFondo)
            => await repo.EliminarAsync(idFondo);

        public async Task<IEnumerable<BandejaFondoDTO>> ObtenerBandejaModificacion()
            => await repo.ObtenerBandejaModificacion();

        public async Task<BandejaFondoDTO?> ObtenerBandejaModificacionPorId(int idFondo)
            => await repo.ObtenerBandejaModificacionPorId(idFondo);

        public async Task<IEnumerable<BandejaFondoDTO>> ObtenerBandejaInactivacion()
            => await repo.ObtenerBandejaInactivacion();

        public async Task<IEnumerable<BandejaAprobacionDTO>> ObtenerBandejaAprobacion(string usuarioAprobador)
            => await repo.ObtenerBandejaAprobacion(usuarioAprobador);

        public async Task<BandejaAprobacionDTO?> ObtenerBandejaAprobacionPorId(int idFondo, int idAprobacion)
            => await repo.ObtenerBandejaAprobacionPorId(idFondo, idAprobacion);

        public async Task<ControlErroresDTO> AprobarFondo(AprobarFondoRequest fondo)
            => await repo.AprobarFondo(fondo);
    }
}
