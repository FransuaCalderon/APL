using AppAPL.Dto.Parametrizacion;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Abstracciones
{
    public interface IParametrizacionRepositorio
    {
        Task<IEnumerable<AlmacenesGrupoConfigDTO>> ConsultarAlmacenGrupo(int codigo);
        Task<IEnumerable<AportesArticuloDTO>> ConsultarAportesArticulo();
        Task<IEnumerable<AportesMarcaDTO>> ConsultarAportesMarca();
        Task<IEnumerable<AportesMarcaProvDTO>> ConsultarAportesMarcaProv();
        Task<IEnumerable<GruposAlmacenConfigDTO>> ConsultarGrupoAlmacen();
        Task<IEnumerable<MargenMinimoDTO>> ConsultarMargenMinimo();
        Task<IEnumerable<MediosPagoConfigDTO>> ConsultarMediosPago();
        Task<IEnumerable<OtrosCostosConfigDTO>> ConsultarOtrosCostos();
        Task<IEnumerable<ParametroConfigDTO>> ConsultarParametros();
        Task<IEnumerable<PorcIncrementoDTO>> ConsultarPorcIncremento();
        Task<IEnumerable<PreciosCompetenciaDTO>> ConsultarPreciosCompetencia();
        Task<MantenimientoParametrosResponseDTO> MantParametros(MantenimientoParametrosRequestDTO request);
    }
}
