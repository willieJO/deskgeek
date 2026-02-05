using APIFinancia.Shared;
using Microsoft.Data.SqlClient;
using Newtonsoft.Json.Linq;
using System.Data;
using System.Diagnostics;
using System.Reflection;
using System.Security;

namespace APIFinancia.Infra
{
    public class ADOContext : IDisposable
    {
        public SqlConnection connection;
        public SqlTransaction transaction = null;
        private static int connectionTimeout = 120;
        private SqlConnectionStringBuilder connectionString;

        public ADOContext(string applicationName = "WebApplication") : this(ConformitySettings.ConnectionString, new StackTrace().GetFrame(1)?.GetMethod()?.DeclaringType?.FullName ?? (new StackTrace()?.GetFrame(1)?.GetMethod()?.DeclaringType?.Name ?? applicationName))
        {
        }

        public ADOContext(bool custom, string appendConnectionString, string applicationName = "WebApplication") : this(ConformitySettings.ConnectionString + appendConnectionString, new StackTrace().GetFrame(1)?.GetMethod()?.DeclaringType?.FullName ?? (new StackTrace()?.GetFrame(1)?.GetMethod()?.DeclaringType?.Name ?? applicationName))
        {

        }
 
        public ADOContext(string dataSource, string catalog, string password, string user)
        {
            connectionString = new SqlConnectionStringBuilder();
            connectionString.DataSource = dataSource;
            connectionString.InitialCatalog = catalog;

            if (!string.IsNullOrEmpty(password))
            {
                connectionString.Password = password;
                connectionString.UserID = user;
            }
            else
            {
                connectionString.IntegratedSecurity = true;
            }

            try
            {
                connection = new SqlConnection();
                {
                    connection.ConnectionString = connectionString.ConnectionString;
                }
                connection.Open();
            }
            catch (SqlException ex)
            {
                closeConnection();
                throw;
            }
            catch (Exception ex)
            {
                closeConnection();
                throw;
            }
        }

        public ADOContext(string connectionStringDoWebConfig, string applicationName)
        {
            try
            {
                var connectionString = $"Max Pool Size=32767;{connectionStringDoWebConfig};Application Name={applicationName};";
                connection = new SqlConnection();
                connection.ConnectionString = connectionString;
                connection.Open();
            }
            catch (SqlException ex)
            {
                closeConnection();
                throw;
            }
            catch (Exception ex)
            {
                closeConnection();
                throw;
            }
        }

        public ADOContext(SqlConnectionStringBuilder connectionString1)
        {
            try
            {
                var connectionString = connectionString1.ConnectionString;
                connection = new SqlConnection();
                connection.ConnectionString = connectionString;
                connection.Open();
            }
            catch (SqlException ex)
            {
                closeConnection();
                throw;
            }
            catch (Exception ex)
            {
                closeConnection();
                throw;
            }
        }

        public static SqlConnection GetConnection(string dataSource, string catalog, string password, string user)
        {
            var connectionString = new SqlConnectionStringBuilder();
            connectionString.DataSource = dataSource;
            connectionString.InitialCatalog = catalog;
            connectionString.Password = password;
            connectionString.UserID = user;

            try
            {
                var connection = new SqlConnection();
                {
                    connection.ConnectionString = connectionString.ConnectionString;
                }
                connection.Open();
                return connection;
            }
            catch (SqlException ex)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public T GetById<T>(string table, long id)
        {
            string query = $@"SELECT TOP 1 * FROM {table} with (nolock)
                              WHERE Id=@Id";
            using (SqlCommand cmd = CreateSqlCommand(query))
            {
                cmd.CommandType = CommandType.Text;
                cmd.AddParameterNullable("@Id", id);
                return this.SearchQuery<T>(cmd).FirstOrDefault();
            }
        }

        public List<T> SearchQuery<T>(string query, int timeout = 0)
        {
            try
            {
                var listReturn = new List<T>();

                using (SqlCommand command = CreateSqlCommand(query))
                {
                    command.CommandTimeout = (timeout > 0 ? timeout : connectionTimeout);
                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            object instance = Activator.CreateInstance(typeof(T));

                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                try
                                {
                                    if (!reader.IsDBNull(i))
                                    {
                                        var info = instance.GetType().GetProperty(reader.GetName(i), BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                                        if (info != null)
                                        {
                                            Type type = Nullable.GetUnderlyingType(info.PropertyType) ?? info.PropertyType;
                                            info.SetValue(instance, Convert.ChangeType(reader[i], type));
                                        }
                                    }
                                }
                                catch (Exception e)
                                {
                                    throw;
                                }
                            }
                            listReturn.Add((T)instance);
                        }
                    }
                }
                return listReturn;
            }
            catch (Exception e)
            {
                throw;
            }

        }
        public async Task<List<T>> SearchQueryAsync<T>(SqlCommand command)
        {
            try
            {
                LinkTransactionToSqlCommand(command); 
                var listReturn = new List<T>();

                command.CommandTimeout = connectionTimeout;

                using (SqlDataReader reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        object instance = Activator.CreateInstance(typeof(T));

                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            try
                            {
                                if (!await reader.IsDBNullAsync(i))
                                {
                                    var info = instance.GetType().GetProperty(reader.GetName(i), BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                                    if (info != null)
                                    {
                                        Type type = Nullable.GetUnderlyingType(info.PropertyType) ?? info.PropertyType;
                                        object safeValue = Convert.ChangeType(reader.GetValue(i), type);
                                        info.SetValue(instance, safeValue);
                                    }
                                }
                            }
                            catch (Exception)
                            {
                                throw; 
                            }
                        }

                        listReturn.Add((T)instance);
                    }
                }

                return listReturn;
            }
            catch (Exception)
            {
                throw; // considere logar antes de relançar
            }
        }


        public async Task<List<T>> SearchQueryAsync<T>(string query, int timeout = 0)
        {
            try
            {
                var listReturn = new List<T>();
                using (SqlCommand command = CreateSqlCommand(query))
                {
                    command.CommandTimeout = (timeout > 0 ? timeout : connectionTimeout); 
                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            object instance = Activator.CreateInstance(typeof(T));

                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                try
                                {
                                    if (!reader.IsDBNull(i))
                                    {
                                        var info = instance.GetType().GetProperty(reader.GetName(i), BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                                        if (info != null)
                                        {
                                            Type type = Nullable.GetUnderlyingType(info.PropertyType) ?? info.PropertyType;
                                            info.SetValue(instance, Convert.ChangeType(reader[i], type));
                                        }
                                    }
                                }
                                catch (Exception e)
                                {
                                    throw;
                                }
                            }
                            listReturn.Add((T)instance);
                        }
                    }
                }
                return listReturn;
            }
            catch (Exception e)
            {
                throw;
            }

        }

        public List<T> SearchQuery<T>(SqlCommand command)
        {
            try
            {
                LinkTransactionToSqlCommand(command);
                var listReturn = new List<T>();

                command.CommandTimeout = connectionTimeout;
                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        object instance = Activator.CreateInstance(typeof(T));

                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            try
                            {
                                if (!reader.IsDBNull(i))
                                {
                                    var info = instance.GetType().GetProperty(reader.GetName(i), BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                                    if (info != null)
                                    {
                                        Type type = Nullable.GetUnderlyingType(info.PropertyType) ?? info.PropertyType;
                                        info.SetValue(instance, Convert.ChangeType(reader[i], type));
                                    }
                                }
                            }
                            catch (Exception)
                            {
                                throw;
                            }
                        }
                        listReturn.Add((T)instance);
                    }
                }
                return listReturn;
            }
            catch (Exception)
            {
                throw;
            }

        }

        public List<Dictionary<string, object>> QueryNinjaADO(string query)
        {
            List<Dictionary<string, object>> items = new List<Dictionary<string, object>>();
            using (SqlCommand command = CreateSqlCommand(query))
            {

                command.CommandTimeout = connectionTimeout; 
                using (SqlDataReader reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        Dictionary<string, object> row = new Dictionary<string, object>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            System.Type type = reader[i].GetType();
                            row[reader.GetName(i)] = Convert.ChangeType(reader[i], type);
                        }

                        items.Add(row);
                    }
                }
            }
            return items;
        }

        public List<JObject> QueryNinjaADOJObject(string query)
        {
            List<JObject> items = new List<JObject>();
            SqlCommand command = CreateSqlCommand(query);
            command.CommandTimeout = connectionTimeout; 
            using (SqlDataReader reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    JObject row = new JObject();
                    for (int i = 0; i < reader.FieldCount; i++)
                        row[reader.GetName(i)] = reader[i].ToString();

                    items.Add(row);
                }
            }
            return items;
        }

        public dynamic QueryNinjaDataTable(string query)
        {

            List<JObject> items = new List<JObject>();
            SqlCommand command = CreateSqlCommand(query);
            command.CommandTimeout = connectionTimeout; 
            List<JObject> datas = new List<JObject>();
            List<JObject> columns = new List<JObject>();
            var retorno = new { datas, columns };
            using (SqlDataReader reader = command.ExecuteReader())
            {

                while (reader.Read())
                {
                    var row = new JObject();
                    for (int i = 0; i < reader.FieldCount; i++)
                        row[reader.GetName(i)] = reader[i].ToString();

                    datas.Add(row);
                }


                for (int i = 0; i < reader.FieldCount; i++)
                {
                    var col = new JObject();
                    col["title"] = col["data"] = reader.GetName(i);
                    columns.Add(col);
                }
            }
            return retorno;
        }

        public int InsertUpdateData(SqlCommand cmd)
        {
            LinkTransactionToSqlCommand(cmd);
            cmd.CommandTimeout = connectionTimeout;

            cmd.CommandType = CommandType.Text;
            cmd.Connection = connection;
            try
            {
                int newID;
                newID = Int32.Parse(cmd.ExecuteScalar().ToString());
                return newID;
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {

            }

        }
        public int InsertUpdateData(SqlCommand cmd, int connectionTimeout)
        {
            LinkTransactionToSqlCommand(cmd);
            cmd.CommandTimeout = connectionTimeout;
            return InsertUpdateData(cmd);
        }

        public T InsertUpdateData<T>(T obj)
        {
            SqlCommand cmd = GetQuery(obj);
            cmd.CommandTimeout = connectionTimeout;

            cmd.CommandType = CommandType.Text;
            cmd.Connection = connection;
            try
            {
                if (obj.GetType().GetProperty("Id") != null)
                {
                    var id = (int)obj.GetType().GetProperty("Id").GetValue(obj, null);
                    if (id > 0)
                        cmd.ExecuteNonQuery();
                    else
                    {
                        int newID;
                        newID = (int)cmd.ExecuteScalar();
                        obj.GetType().GetProperty("Id").SetValue(obj, newID);
                    }
                }
            }
            catch (Exception ex)
            {
                throw;
            }
            finally
            {
                connection.Close();
                connection.Dispose();
            }

            return obj;
        }

        public async Task<T> InsertUpdateDataAsync<T>(T obj)
        {
            SqlCommand cmd = GetQuery(obj);
            cmd.CommandTimeout = connectionTimeout;

            cmd.CommandType = CommandType.Text;
            cmd.Connection = connection;
            try
            {
                if (obj.GetType().GetProperty("Id") != null)
                {
                    var id = (int)obj.GetType().GetProperty("Id").GetValue(obj, null);
                    if (id > 0)
                        cmd.ExecuteNonQuery();
                    else
                    {
                        int newID;
                        newID = (int)await cmd.ExecuteScalarAsync();
                        obj.GetType().GetProperty("Id").SetValue(obj, newID);
                    }
                }
            }
            catch (Exception ex)
            {
                throw;
            }
            finally
            {
                connection.Close();
                connection.Dispose();
            }

            return obj;
        }

        private static SqlCommand GetQuery<T>(T obj)
        {
            SqlCommand cmd = new SqlCommand();
            cmd.CommandTimeout = connectionTimeout; 

            if (obj.GetType().GetProperty("Id") != null)
            {
                var id = (int)obj.GetType().GetProperty("Id").GetValue(obj, null);
                if (id > 0)
                    cmd = UpdateQuery(obj, id);
                else
                    cmd = InsertQuery(obj);
            }

            return cmd;
        }

        private static SqlCommand UpdateQuery<T>(T obj, int id)
        {

            var query = "UPDATE " + obj.GetType().Name;
            var queryProps = " SET ";

            foreach (var item in obj.GetType().GetProperties())
            {
                if (item.Name != "Id" && item.Name != "AddDate" && item.Name != "AlterDate" && !item.Name.StartsWith("_"))
                {


                    if (item.PropertyType.IsClass && item.PropertyType.Name != "String")
                        continue;

                    queryProps += "\n " + item.Name + " = @" + item.Name + ", ";
                }
            }

            var queryDebug = "UPDATE " + obj.GetType().Name;
            var queryPropsDebug = " SET ";

            foreach (var item in obj.GetType().GetProperties())
            {
                if (item.Name != "Id" && item.Name != "AddDate" && item.Name != "AlterDate" && !item.Name.StartsWith("_"))
                {


                    if (item.PropertyType.IsClass && item.PropertyType.Name != "String")
                        continue;

                    queryPropsDebug += "\n " + item.Name + " = " + (obj.GetType().GetProperty(item.Name).GetValue(obj) == null ? "null" : item.GetValue(obj)) + ", ";
                }
            }

            var resultDebug = queryDebug + queryPropsDebug;

            queryProps = queryProps.Substring(0, queryProps.LastIndexOf(", ")) + "\n ";

            query += queryProps;
            query += " WHERE Id = " + id;
            query += " \n SELECT CAST(scope_identity() AS int)";

            SqlCommand cmd;
            cmd = new SqlCommand(query);
            cmd.CommandTimeout = connectionTimeout;
            var pqp = string.Empty;
            foreach (var item in obj.GetType().GetProperties())
            {
                if (item.Name != "Id" && item.Name != "AddDate" && item.Name != "AlterDate")
                {
                    if (item.PropertyType.Name == "String")
                        if (string.IsNullOrEmpty(obj.GetType().GetProperty(item.Name).GetValue(obj) as string))
                        {
                            cmd.Parameters.AddWithValue("@" + item.Name, "");
                            continue;
                        }

                    if (obj.GetType().GetProperty(item.Name).GetValue(obj) == null)
                    {
                        cmd.Parameters.AddWithValue("@" + item.Name, obj.GetType().GetProperty(item.Name).GetValue(obj));
                        pqp += "@" + item.Name + " = " + obj.GetType().GetProperty(item.Name).GetValue(obj);
                        continue;
                    }


                    if (item.PropertyType.IsClass && item.PropertyType.Name != "String")
                        continue;

                    cmd.Parameters.AddWithValue("@" + item.Name, obj.GetType().GetProperty(item.Name).GetValue(obj));
                    pqp += "@" + item.Name + " = " + obj.GetType().GetProperty(item.Name).GetValue(obj);

                }
            }

            return cmd;

        }

        private static SqlCommand InsertQuery<T>(T obj)
        {
            var query = "INSERT INTO " + obj.GetType().Name;
            var queryProps = "(";
            var queryValues = " VALUES (";

            foreach (var item in obj.GetType().GetProperties())
            {
                if (item != null && item.Name != "Id" && item.Name != "AddDate" && item.Name != "AlterDate" && !item.Name.StartsWith("_"))
                {
                    if (obj.GetType().GetProperty(item.Name).GetValue(obj) == null)
                        continue;

                    if (item.PropertyType.Name == "String")
                        if (string.IsNullOrEmpty(obj.GetType().GetProperty(item.Name).GetValue(obj) as string))
                            continue;

                    if (item.PropertyType.IsClass && item.PropertyType.Name != "String")
                        continue;

                    queryProps += "\n " + item.Name + ", ";
                    queryValues += "\n @" + item.Name + ", ";
                }
            }

            queryProps = queryProps.Substring(0, queryProps.LastIndexOf(", ")) + "\n )";
            queryValues = queryValues.Substring(0, queryValues.LastIndexOf(", ")) + "\n )";

            query += queryProps;
            query += queryValues;
            query += " \n SELECT CAST(scope_identity() AS int)";

            SqlCommand cmd;
            cmd = new SqlCommand(query);
            cmd.CommandTimeout = connectionTimeout; 

            foreach (var item in obj.GetType().GetProperties())
            {
                if (item != null && item.Name != "Id" && item.Name != "AddDate" && item.Name != "AlterDate")
                {
                    if (obj.GetType().GetProperty(item.Name).GetValue(obj) == null)
                        continue;

                    if (item.PropertyType.Name == "String")
                        if (string.IsNullOrEmpty(obj.GetType().GetProperty(item.Name).GetValue(obj) as string))
                            continue;

                    if (item.PropertyType.IsClass && item.PropertyType.Name != "String")
                        continue;

                    cmd.Parameters.AddWithValue("@" + item.Name, obj.GetType().GetProperty(item.Name).GetValue(obj));
                }
            }

            return cmd;

        }

        public int ExecuteSql(string query)
        {
            try
            {
                using (SqlCommand command = CreateSqlCommand(query))
                {
                    command.CommandTimeout = connectionTimeout;
                    return command.ExecuteNonQuery();
                }

            }
            catch (Exception e)
            {
                throw;
            }
        }

        public int ExecuteSqlWithoutCloseConnection(string query, int quantidadeTentativa = 0)
        {
            try
            {
                using (SqlCommand command = CreateSqlCommand(query))
                {
                    command.CommandTimeout = connectionTimeout; 
                    return command.ExecuteNonQuery();
                }
            }
            catch (SqlException e) when (e.Number == 1205)
            {
                throw;
            }
            catch (Exception e)
            {
                throw;
            }
        }

        public List<T> ExecuteStoredProcedure<T>(string query)
        {
            var listReturn = new List<T>();
            try
            {
                using (SqlCommand command = CreateSqlCommand(query))
                {
                    command.CommandType = System.Data.CommandType.StoredProcedure;
                    command.CommandTimeout = connectionTimeout; 

                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            object instance = Activator.CreateInstance(typeof(T));

                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                if (!reader.IsDBNull(i))
                                    instance.GetType().GetProperty(reader.GetName(i)).SetValue(instance, reader[i]);
                            }
                            listReturn.Add((T)instance);
                        }
                    }
                    return listReturn;
                }
            }
            catch (Exception e)
            {
                throw;
            }
        }

        [SecuritySafeCritical]
        protected void closeConnection()
        {
            if (((connection != null)))
            {
                connection.Close();
                connection.Dispose();
            }
        }

        public void Dispose()
        {
            closeConnection();
        }

        private SqlCommand CreateSqlCommand(string query)
        {
            SqlCommand command;
            if (this.transaction != null)
            {
                command = new SqlCommand(query, connection, transaction);
            }
            else
            {
                command = new SqlCommand(query, connection);
            }
            return command;
        }

        private void LinkTransactionToSqlCommand(SqlCommand sqlCommand)
        {
            if (this.transaction != null)
            {
                sqlCommand.Transaction = transaction;
            }
        }
    }
}
