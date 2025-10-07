using Oracle.ManagedDataAccess.Client;
using System.Data;

namespace AppAPL.AccesoDatos.Oracle
{
    public sealed class OracleConnectionFactory
    {
        private readonly OracleConfig _cfg;
        public OracleConnectionFactory(OracleConfig cfg) => _cfg = cfg;

        public OracleConnection CreateOpenConnection()
        {
            var conn = new OracleConnection(_cfg.ConnectionString);
            conn.Open();
            return conn;
        }
    }
}