namespace AppAPL.Api.Attributes
{
    public class EmailAttribute : Attribute
    {
        private readonly string tipo;
        private readonly bool logDetallado;

        public EmailAttribute()
        {
            
        }

        public EmailAttribute(string tipo, bool logDetallado = false)
        {
            this.tipo = tipo;
            this.logDetallado = logDetallado;
        }
    }
}
