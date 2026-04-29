using AppAPL.Dto.Parametrizacion;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.Negocio.Abstracciones
{
    public interface IParametrizacionServicio
    {
        Task<IEnumerable<ParametroConfigDTO>> ConsultarParametros();
        Task<IEnumerable<GruposAlmacenConfigDTO>> ConsultarGrupoAlmacen();
        Task<IEnumerable<AlmacenesGrupoConfigDTO>> ConsultarAlmacenGrupo(int codigo);
        Task<IEnumerable<MediosPagoConfigDTO>> ConsultarMediosPago();
        Task<IEnumerable<AportesMarcaDTO>> ConsultarAportesMarca();
        Task<IEnumerable<AportesMarcaProvDTO>> ConsultarAportesMarcaProv();
        Task<IEnumerable<AportesArticuloDTO>> ConsultarAportesArticulo();
        Task<IEnumerable<PreciosCompetenciaDTO>> ConsultarPreciosCompetencia();
        Task<IEnumerable<MargenMinimoDTO>> ConsultarMargenMinimo();
        Task<IEnumerable<PorcIncrementoDTO>> ConsultarPorcIncremento();
        Task<IEnumerable<OtrosCostosConfigDTO>> ConsultarOtrosCostos();
        Task<MantenimientoParametrosResponseDTO> MantParametros(MantenimientoParametrosRequestDTO request);
    }
}
