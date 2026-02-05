using Microsoft.Data.SqlClient;

namespace APIFinancia.Shared
{
    public static class ADOHelper
    {
        public static void AddParameterNullable(this SqlCommand cmd, string key, object valor)
        {
            if (valor == null)
            {
                cmd.Parameters.Add(new SqlParameter(key, DBNull.Value));
            }
            else
            {
                cmd.Parameters.Add(new SqlParameter(key, valor));
            }
        }
    }
}
