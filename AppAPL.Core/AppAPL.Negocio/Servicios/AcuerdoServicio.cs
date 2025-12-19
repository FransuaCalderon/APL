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
using AutoMapper;
using Org.BouncyCastle.Asn1.Mozilla;

namespace AppAPL.Negocio.Servicios
{
    public class AcuerdoServicio (IAcuerdoRepositorio repo, IMapper mapper) : IAcuerdoServicio
    {
        

        public Task<IEnumerable<ConsultarAcuerdoFondoDTO>> ConsultarAcuerdoFondo(int idFondo)
            => repo.ConsultarAcuerdoFondo(idFondo);

        public Task<IEnumerable<FondoAcuerdoDTO>> ConsultarFondoAcuerdo()
            => repo.ConsultarFondoAcuerdo();

        public Task<IEnumerable<ArticuloDTO>> ConsultarArticulos(ConsultarArticuloDTO dto)
            => repo.ConsultarArticulos(dto);

        public Task<FiltrosItemsDTO> CargarCombosFiltrosItems()
            => repo.CargarCombosFiltrosItems();

        public Task<ControlErroresDTO> CrearAsync(CrearAcuerdoGrupoDTO acuerdo)
            => repo.CrearAsync(acuerdo);

        public Task<IEnumerable<BandejaAprobacionAcuerdoDTO>> ConsultarBandAprobAcuerdo(string usuarioAprobador)
            => repo.ConsultarBandAprobAcuerdo(usuarioAprobador);

        public Task<BandAproAcuerdoPorIDDTO?> ObtenerBandejaAprobacionPorId(int idAcuerdo, int idAprobacion)
            => repo.ObtenerBandejaAprobacionPorId(idAcuerdo, idAprobacion);


        public Task<ControlErroresDTO> AprobarAcuerdo(AprobarAcuerdoRequest acuerdo)
            => repo.AprobarAcuerdo(acuerdo);

        /*
        public Task<IEnumerable<AcuerdoDTO>> ListarAsync()
            => repo.ObtenerAcuerdosAsync();

        public Task<AcuerdoDTO?> ObtenerPorIdAsync(int idAcuerdo)
            => repo.ObtenerPorIdAsync(idAcuerdo);

        public Task<IEnumerable<AcuerdoFondoDTO>> ObtenerAcuerdosFondosAsync()
            => repo.ObtenerAcuerdosFondosAsync();

        public Task<AcuerdoFondoDTO?> ObtenerAcuerdoFondoPorIdAsync(int idAcuerdo)
            => repo.ObtenerAcuerdoFondoPorIdAsync(idAcuerdo);
        */

        public Task<IEnumerable<BandejaModificacionAcuerdoDTO>> ConsultarBandModAcuerdo()
            => repo.ConsultarBandModAcuerdo();

        public Task<BandModAcuerdoPorIDDTO?> ObtenerBandejaModificacionPorId(int idAcuerdo)
            => repo.ObtenerBandejaModificacionPorId(idAcuerdo);

        public Task<IEnumerable<BandejaInactivacionAcuerdoDTO>> ConsultarBandInacAcuerdo()
            => repo.ConsultarBandInacAcuerdo();

        public Task<IEnumerable<BandejaConsultaAcuerdoDTO>> ConsultarBandConsAcuerdo()
            => repo.ConsultarBandConsAcuerdo();

        public Task<BandConsAcuerdoPorIDDTO?> ObtenerBandejaConsultaPorId(int idAcuerdo)
            => repo.ObtenerBandejaConsultaPorId(idAcuerdo);

        public Task<InactivarAcuerdoResponse> InactivarAcuerdo(InactivarAcuerdoRequest acuerdo)
            => repo.InactivarAcuerdo(acuerdo);

        public Task<ControlErroresDTO> ActualizarAsync(ActualizarAcuerdoDTO actualizarAcuerdoDTO)
            => repo.ActualizarAsync(actualizarAcuerdoDTO);
    }
}
