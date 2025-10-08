using Dapper;
using Oracle.ManagedDataAccess.Client;
using Oracle.ManagedDataAccess.Types;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace AppAPL.AccesoDatos.Oracle
{
    public class OracleDynamicParameters : SqlMapper.IDynamicParameters
    {
        private readonly List<OracleParameter> _parameters = new();

        public OracleDynamicParameters() { }

        // 🔹 Constructor con objeto anónimo
        public OracleDynamicParameters(object paramObject)
        {
            if (paramObject == null) return;

            foreach (var prop in paramObject.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                var name = prop.Name;
                var value = prop.GetValue(paramObject);

                _parameters.Add(new OracleParameter
                {
                    ParameterName = name,
                    OracleDbType = GetOracleDbType(value),
                    Direction = ParameterDirection.Input,
                    Value = value ?? DBNull.Value
                });
            }
        }

        // 🔹 Agregar parámetro manualmente (OracleDbType)
        public void Add(string name, OracleDbType oracleType, ParameterDirection direction, object? value = null, int? size = null)
        {
            var param = new OracleParameter
            {
                ParameterName = name,
                OracleDbType = oracleType,
                Direction = direction,
                Value = value ?? DBNull.Value
            };
            if (size.HasValue)
                param.Size = size.Value;

            _parameters.Add(param);
        }

        // 🔹 Agregar parámetro con DbType (compatibilidad Dapper)
        public void Add(string name, DbType dbType, ParameterDirection direction, object? value = null, int? size = null)
        {
            var oracleType = ConvertDbTypeToOracleDbType(dbType);

            var param = new OracleParameter
            {
                ParameterName = name,
                OracleDbType = oracleType,
                Direction = direction,
                Value = value ?? DBNull.Value
            };
            if (size.HasValue)
                param.Size = size.Value;

            _parameters.Add(param);
        }

        // 🔹 Obtener valor de parámetro OUT
        public T? Get<T>(string name)
        {
            var param = _parameters.FirstOrDefault(p =>
                string.Equals(p.ParameterName, name, StringComparison.OrdinalIgnoreCase));

            if (param == null)
                throw new KeyNotFoundException($"No se encontró el parámetro '{name}'.");

            if (param.Value == DBNull.Value || param.Value == null)
                return default;

            // ⚡ Soporte para OracleDecimal, OracleString, etc.
            if (param.Value is OracleDecimal od)
            {
                return (T)Convert.ChangeType(od.ToInt32(), typeof(T));
            }
            if (param.Value is OracleString os)
            {
                return (T)Convert.ChangeType(os.Value, typeof(T));
            }
            if (param.Value is OracleDate odate)
            {
                return (T)Convert.ChangeType(odate.Value, typeof(T));
            }

            return (T)Convert.ChangeType(param.Value, typeof(T));
        }

        // 🔹 Método requerido por Dapper
        public void AddParameters(IDbCommand command, SqlMapper.Identity identity)
        {
            if (command is not OracleCommand oracleCommand)
                throw new InvalidOperationException("Este parámetro solo funciona con OracleCommand.");

            oracleCommand.BindByName = true;
            oracleCommand.Parameters.AddRange(_parameters.ToArray());
        }

        // 🔹 Deducción automática del tipo Oracle
        private static OracleDbType GetOracleDbType(object? value)
        {
            if (value == null) return OracleDbType.Varchar2;

            return value switch
            {
                int => OracleDbType.Int32,
                long => OracleDbType.Int64,
                decimal => OracleDbType.Decimal,
                double => OracleDbType.Double,
                DateTime => OracleDbType.Date,
                bool => OracleDbType.Int16,
                byte[] => OracleDbType.Blob,
                OracleDbType => (OracleDbType)value, // Soporte directo si se pasa OracleDbType
                _ => OracleDbType.Varchar2
            };
        }

        // 🔹 Conversión DbType → OracleDbType
        private static OracleDbType ConvertDbTypeToOracleDbType(DbType dbType) => dbType switch
        {
            DbType.Int32 => OracleDbType.Int32,
            DbType.Int64 => OracleDbType.Int64,
            DbType.Decimal => OracleDbType.Decimal,
            DbType.Double => OracleDbType.Double,
            DbType.Date => OracleDbType.Date,
            DbType.String => OracleDbType.Varchar2,
            DbType.Boolean => OracleDbType.Int16,
            DbType.Binary => OracleDbType.Blob,
            _ => OracleDbType.Varchar2
        };
    }
}
