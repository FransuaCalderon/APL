using AppAPL.Dto.Email;

namespace AppAPL.Api.Attributes
{
    public class EmailAttribute: Attribute
    {
        public TipoAccionEmail TipoAccion { get; }

        public EmailAttribute()
        {
            
        }

        public EmailAttribute(TipoAccionEmail tipo)
        {
            TipoAccion = tipo;
        }

        

    }

    public enum TipoAccionEmail
    {
        Creacion,
        Aprobacion,
        Inactivacion
    }


}
