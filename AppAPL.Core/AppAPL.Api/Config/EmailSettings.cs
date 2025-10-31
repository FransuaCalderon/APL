namespace AppAPL.Api.Config
{
    public class EmailSettings
    {
        public string FromName { get; set; }
        public string FromEmail { get; set; }
        public string SmtpServer { get; set; }
        public int Port { get; set; }
        public bool UseSSL { get; set; }
        public string Username { get; set; } 

        public string Password { get; set; }
    }
}
