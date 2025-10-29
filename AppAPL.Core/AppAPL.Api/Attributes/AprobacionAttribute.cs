namespace AppAPL.Api.Attributes
{
    public class AprobacionAttribute: Attribute
    {
        private readonly string tipo;
        private readonly bool logDetallado;

        public AprobacionAttribute()
        {

        }


        public AprobacionAttribute(string tipo, bool logDetallado = false)
        {
            this.tipo = tipo;
            this.logDetallado = logDetallado;
        }

        
    }
}
