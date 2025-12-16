using AppAPL.Dto.Email;

namespace AppAPL.Api.Attributes
{
    
    public class EmailAttribute: Attribute
    {
        public string Entidad { get; }
        public TipoProceso TipoProceso { get; }

        public EmailAttribute(string entidad, TipoProceso tipoProceso)
        {
            Entidad = entidad;
            TipoProceso = tipoProceso;
        }
    }

    public enum TipoProceso
    {
        Creacion,
        Modificacion,
        Aprobacion,
        Inactivacion,
        Rechazo
    }
}
