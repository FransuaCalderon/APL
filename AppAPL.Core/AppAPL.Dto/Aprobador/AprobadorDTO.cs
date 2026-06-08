using System.Text.Json.Serialization;


namespace AppAPL.Dto.Aprobador
{
    
    // ============================================================
    // DTO de respuesta (mapea el JSON_OBJECT de los SP de consulta)
    // Usado por SP_CONSULTA_LISTA y SP_CONSULTA_ESPECIFICA
    // ============================================================
    public class AprobadorDTO
    {
        [JsonPropertyName("idaprobador")]
        public long IdAprobador { get; set; }

        [JsonPropertyName("entidad")]
        public long Entidad { get; set; }

        [JsonPropertyName("nombre_entidad")]
        public string? NombreEntidad { get; set; }

        [JsonPropertyName("idetiqueta_entidad")]
        public string? IdEtiquetaEntidad { get; set; }

        [JsonPropertyName("idtipoproceso")]
        public long IdTipoProceso { get; set; }

        [JsonPropertyName("nombre_tipo_proceso")]
        public string? NombreTipoProceso { get; set; }

        [JsonPropertyName("idetiqueta_tipo_proceso")]
        public string? IdEtiquetaTipoProceso { get; set; }

        [JsonPropertyName("iduseraprobador")]
        public string? IdUserAprobador { get; set; }

        [JsonPropertyName("nivelaprobacion")]
        public int NivelAprobacion { get; set; }

        [JsonPropertyName("idusuarioingreso")]
        public string? IdUsuarioIngreso { get; set; }

        [JsonPropertyName("fechaingreso")]
        public DateTime? FechaIngreso { get; set; }

        [JsonPropertyName("idusuariomodifica")]
        public string? IdUsuarioModifica { get; set; }

        [JsonPropertyName("fechamodifica")]
        public DateTime? FechaModifica { get; set; }

        [JsonPropertyName("idestadoregistro")]
        public long IdEstadoRegistro { get; set; }

        [JsonPropertyName("estado_registro")]
        public string? EstadoRegistro { get; set; }

        [JsonPropertyName("idetiqueta_estado")]
        public string? IdEtiquetaEstado { get; set; }
    }

    // ============================================================
    // SP_INGRESO ('I')
    // ============================================================
    public class CrearAprobadorRequest
    {
        public long Entidad { get; set; }
        public long IdTipoProceso { get; set; }
        public string IdUserAprobador { get; set; } = string.Empty;
        public int NivelAprobacion { get; set; }     // 1 o 2
        public string IdUsuario { get; set; } = string.Empty;
    }

    // ============================================================
    // SP_MODIFICACION ('M')
    // ============================================================
    public class ActualizarAprobadorRequest
    {
        public long IdAprobador { get; set; }
        public string IdUserAprobador { get; set; } = string.Empty;
        public int NivelAprobacion { get; set; }     // 1 o 2
        public string IdUsuario { get; set; } = string.Empty;
    }

    // ============================================================
    // SP_ELIMINACION ('E')
    // ============================================================
    public class EliminarAprobadorRequest
    {
        public long IdAprobador { get; set; }
        public string IdUsuario { get; set; } = string.Empty;
    }
}