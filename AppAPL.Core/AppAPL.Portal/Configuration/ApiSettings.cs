namespace AppAPL.Portal.Configuration
{
    public class ApiSettings
    {
        public string BaseUrl { get; set; } = string.Empty;
        public double TimeoutSeconds { get; set; }
        public bool DeshabilitarValidacionSSL { get; set; } // propiedad para controlar la validación SSL
        public int IdGrupo { get; set; }
    }
}
