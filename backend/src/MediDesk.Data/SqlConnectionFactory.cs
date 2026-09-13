using Microsoft.Data.SqlClient;

namespace MediDesk.Data;

public sealed class SqlConnectionFactory(string connectionString)
{
    public SqlConnection Create() => new(connectionString);
}
