namespace AppAPL.Dto
{
    public class ControlErroresDTO
    {
        public int filasAfectadas { get; set; }
        public int? codigoRetorno { get; set; }
        public string? mensaje { get; set; }

        public int? Id { get; set; }

        public override string ToString()
        {
            return $"filasAfectadas: {filasAfectadas}, codigoRetorno: {codigoRetorno}, mensaje: {mensaje}, Id: {Id}";
        }
    }
}
