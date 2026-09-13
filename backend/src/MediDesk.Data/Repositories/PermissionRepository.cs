using MediDesk.Business.Interfaces;
using Microsoft.Data.SqlClient;

namespace MediDesk.Data.Repositories;

public sealed class PermissionRepository(SqlConnectionFactory connectionFactory) : IPermissionRepository
{
    public async Task<bool> HasPermissionAsync(long userId, string moduleKey, string permission, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT CASE WHEN EXISTS (
                SELECT 1 FROM dbo.Users u
                INNER JOIN dbo.RolePermissions rp ON rp.RoleId=u.RoleId
                INNER JOIN dbo.Permissions p ON p.Id=rp.PermissionId
                INNER JOIN dbo.Modules m ON m.Id=p.ModuleId
                WHERE u.Id=@UserId AND u.IsActive=1 AND m.IsActive=1
                  AND m.[Key]=@ModuleKey AND p.Permission=@Permission
            ) THEN 1 ELSE 0 END;
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@ModuleKey", moduleKey);
        command.Parameters.AddWithValue("@Permission", permission);
        return Convert.ToBoolean(await command.ExecuteScalarAsync(cancellationToken));
    }
}
