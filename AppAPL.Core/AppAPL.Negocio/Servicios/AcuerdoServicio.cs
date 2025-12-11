using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto;
using AppAPL.Dto.Acuerdo;
using AppAPL.Dto.Fondos;
using AppAPL.Negocio.Abstracciones;

namespace AppAPL.Negocio.Servicios
{
    public class AcuerdoServicio (IAcuerdoRepositorio repo) : IAcuerdoServicio
    {
        

        public Task<IEnumerable<ConsultarAcuerdoFondoDTO>> ConsultarAcuerdoFondo(int idFondo)
            => repo.ConsultarAcuerdoFondo(idFondo);

        public Task<IEnumerable<FondoAcuerdoDTO>> ConsultarFondoAcuerdo()
            => repo.ConsultarFondoAcuerdo();

        public Task<IEnumerable<ArticuloDTO>> ConsultarArticulos(ConsultarArticuloDTO dto)
            => repo.ConsultarArticulos(dto);

        public Task<FiltrosItemsDTO> CargarCombosFiltrosItems()
            => repo.CargarCombosFiltrosItems();

        public Task<ControlErroresDTO> CrearAsync(CrearActualizarAcuerdoGrupoDTO acuerdo)
            => repo.CrearAsync(acuerdo);

        public Task<IEnumerable<BandejaAprobacionAcuerdoDTO>> ConsultarBandAprobAcuerdo(string usuarioAprobador)
            => repo.ConsultarBandAprobAcuerdo(usuarioAprobador);

        public Task<BandejaAprobacionAcuerdoDTO?> ObtenerBandejaAprobacionPorId(int idAcuerdo, int idAprobacion)
            => repo.ObtenerBandejaAprobacionPorId(idAcuerdo, idAprobacion);

        public Task<ControlErroresDTO> AprobarAcuerdo(AprobarAcuerdoRequest acuerdo)
            => repo.AprobarAcuerdo(acuerdo);

        public Task<IEnumerable<AcuerdoDTO>> ListarAsync()
            => repo.ObtenerAcuerdosAsync();

        public Task<AcuerdoDTO?> ObtenerPorIdAsync(int idAcuerdo)
            => repo.ObtenerPorIdAsync(idAcuerdo);

        public Task<IEnumerable<AcuerdoFondoDTO>> ObtenerAcuerdosFondosAsync()
            => repo.ObtenerAcuerdosFondosAsync();

        public Task<AcuerdoFondoDTO?> ObtenerAcuerdoFondoPorIdAsync(int idAcuerdo)
            => repo.ObtenerAcuerdoFondoPorIdAsync(idAcuerdo);
    }
}
