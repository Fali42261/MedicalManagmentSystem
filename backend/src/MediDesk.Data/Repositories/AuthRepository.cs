using MediDesk.Business.Interfaces;
using MediDesk.Common.Models;
using Microsoft.Data.SqlClient;

namespace MediDesk.Data.Repositories;

public sealed class AuthRepository(SqlConnectionFactory connectionFactory) : IAuthRepository
{
    public async Task<UserRecord?> GetUserByEmailAsync(string email, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT TOP (1) u.Id, u.FullName, u.Email, u.PasswordHash, r.Name AS RoleName, u.IsActive
            FROM dbo.Users u
            INNER JOIN dbo.Roles r ON r.Id = u.RoleId
            WHERE u.Email = @Email;
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Email", email);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? ReadUser(reader) : null;
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken)
    {
        const string sql = "SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.Users WHERE Email = @Email) THEN 1 ELSE 0 END;";
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@Email", email);
        return Convert.ToBoolean(await command.ExecuteScalarAsync(cancellationToken));
    }

    public async Task<UserRecord> CreateUserAsync(string fullName, string email, string passwordHash, CancellationToken cancellationToken)
    {
        const string sql = """
            DECLARE @RoleId INT = (SELECT Id FROM dbo.Roles WHERE [Name] = 'Billing Operator');
            INSERT INTO dbo.Users (FullName, Email, PasswordHash, RoleId)
            OUTPUT INSERTED.Id
            VALUES (@FullName, @Email, @PasswordHash, @RoleId);
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@FullName", fullName);
        command.Parameters.AddWithValue("@Email", email);
        command.Parameters.AddWithValue("@PasswordHash", passwordHash);
        var id = Convert.ToInt64(await command.ExecuteScalarAsync(cancellationToken));
        return new UserRecord(id, fullName, email, passwordHash, "Billing Operator", true);
    }

    public async Task<IReadOnlyCollection<NavigationRecord>> GetNavigationAsync(long userId, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT m.[Key], m.Label, m.Icon, m.GroupName, m.SortOrder, p.Permission
            FROM dbo.Users u
            INNER JOIN dbo.RolePermissions rp ON rp.RoleId = u.RoleId
            INNER JOIN dbo.Permissions p ON p.Id = rp.PermissionId
            INNER JOIN dbo.Modules m ON m.Id = p.ModuleId
            WHERE u.Id = @UserId AND u.IsActive = 1 AND m.IsActive = 1
            ORDER BY m.SortOrder, p.Permission;
            """;
        var rows = new List<NavigationRecord>();
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@UserId", userId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(new NavigationRecord(
                reader.GetString(0), reader.GetString(1), reader.GetString(2),
                reader.GetString(3), reader.GetInt32(4), reader.GetString(5)));
        }
        return rows;
    }

    public async Task EnsureBootstrapAdminAsync(string fullName, string email, string passwordHash, CancellationToken cancellationToken)
    {
        const string sql = """
            IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = @Email)
            BEGIN
                DECLARE @RoleId INT = (SELECT Id FROM dbo.Roles WHERE [Name] = 'Administrator');
                INSERT INTO dbo.Users (FullName, Email, PasswordHash, RoleId)
                VALUES (@FullName, @Email, @PasswordHash, @RoleId);
            END;
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.AddWithValue("@FullName", fullName);
        command.Parameters.AddWithValue("@Email", email);
        command.Parameters.AddWithValue("@PasswordHash", passwordHash);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static UserRecord ReadUser(SqlDataReader reader) => new(
        reader.GetInt64(0), reader.GetString(1), reader.GetString(2),
        reader.GetString(3), reader.GetString(4), reader.GetBoolean(5));
}
