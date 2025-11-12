using AppAPL.Dto.Email;

namespace AppAPL.Api.Attributes
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class EmailAttribute: Attribute
    {
        public string Entidad { get; }
        public string TipoProceso { get; }
        public string? BodyField { get; set; }

        public EmailAttribute(string entidad, string tipoProceso)
        {
            Entidad = entidad;
            TipoProceso = tipoProceso;
        }
    }
}
