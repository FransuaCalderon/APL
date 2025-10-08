namespace AppAPL.Dto.CatalogoTipo
{
    public class CatalogoTipoDTO
    {
        public int? IdCatalogoTipo { get; set; }
        public string Nombre { get; set; }
        public string? Descripcion { get; set; }
        public int IdUsuarioCreacion { get; set; }
        public DateTime FechaCreacion { get; set; }
        public int? IdUsuarioModificacion { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public int IdEstado { get; set; }
        public int? IdMarcaAbreviaturaAutomatica { get; set; }
        public string? IdEtiqueta { get; set; }
    }

    public class CrearActualizarCatalogoTipoRequest
    {
        public string Nombre { get; set; }
        public string? Descripcion { get; set; }
        public int IdUsuarioCreacion { get; set; }
        public DateTime FechaCreacion { get; set; }
        public int? IdUsuarioModificacion { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public int IdEstado { get; set; }
        public int? IdMarcaAbreviaturaAutomatica { get; set; }
        public string? IdEtiqueta { get; set; }
    }
}
