using AppAPL.AccesoDatos.Abstracciones;
using AppAPL.Dto.Parametrizacion;
using AppAPL.Negocio.Abstracciones;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Servicios
{
    public class ParametrizacionServicio (IParametrizacionRepositorio repo) : IParametrizacionServicio
    {
        public Task<IEnumerable<ParametroConfigDTO>> ConsultarParametros()
            => repo.ConsultarParametros();

        public Task<IEnumerable<GruposAlmacenConfigDTO>> ConsultarGrupoAlmacen()
            => repo.ConsultarGrupoAlmacen();

        public Task<IEnumerable<AlmacenesGrupoConfigDTO>> ConsultarAlmacenGrupo(int codigo)
            => repo.ConsultarAlmacenGrupo(codigo);

        public Task<IEnumerable<MediosPagoConfigDTO>> ConsultarMediosPago()
            => repo.ConsultarMediosPago();

        public Task<IEnumerable<AportesMarcaDTO>> ConsultarAportesMarca()
            => repo.ConsultarAportesMarca();

        public Task<IEnumerable<AportesMarcaProvDTO>> ConsultarAportesMarcaProv()
            => repo.ConsultarAportesMarcaProv();

        public Task<IEnumerable<AportesArticuloDTO>> ConsultarAportesArticulo()
            => repo.ConsultarAportesArticulo();

        public Task<IEnumerable<PreciosCompetenciaDTO>> ConsultarPreciosCompetencia()
            => repo.ConsultarPreciosCompetencia();

        public Task<IEnumerable<MargenMinimoDTO>> ConsultarMargenMinimo()
            => repo.ConsultarMargenMinimo();

        public Task<IEnumerable<PorcIncrementoDTO>> ConsultarPorcIncremento()
            => repo.ConsultarPorcIncremento();

        public Task<IEnumerable<OtrosCostosConfigDTO>> ConsultarOtrosCostos()
            => repo.ConsultarOtrosCostos();

        public Task<MantenimientoParametrosResponseDTO> MantParametros(MantenimientoParametrosRequestDTO request)
            => repo.MantParametros(request);
    }
}
