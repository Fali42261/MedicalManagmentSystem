using System.Data;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Masters;
using Microsoft.Data.SqlClient;

namespace MediDesk.Data.Repositories;

public sealed class MedicineMasterRepository(SqlConnectionFactory connectionFactory) : IMedicineMasterRepository
{
    private const string Columns = """
        master.Id, master.MasterType, master.Name, master.Description, master.IsActive,
        COALESCE(master.UpdatedAtUtc, master.CreatedAtUtc), master.RowVersion,
        CASE master.MasterType
            WHEN 'Category' THEN (SELECT COUNT(1) FROM dbo.Medicines m WHERE m.IsDeleted=0 AND m.Category=master.Name)
            WHEN 'Manufacturer' THEN (SELECT COUNT(1) FROM dbo.Medicines m WHERE m.IsDeleted=0 AND m.Manufacturer=master.Name)
            ELSE (SELECT COUNT(1) FROM dbo.Medicines m WHERE m.IsDeleted=0 AND m.GenericName=master.Name)
        END AS UsageCount
        """;

    public async Task<PagedResponse<MedicineMasterDto>> GetPageAsync(MedicineMasterQuery query, CancellationToken cancellationToken)
    {
        const string where = "master.IsDeleted=0 AND (@Type IS NULL OR master.MasterType=@Type) AND (@Search IS NULL OR master.Name LIKE @SearchLike OR master.Description LIKE @SearchLike)";
        var sql = $"""
            SELECT COUNT(1) FROM dbo.MedicineMasters master WHERE {where};
            SELECT {Columns} FROM dbo.MedicineMasters master WHERE {where}
            ORDER BY master.MasterType, master.Name, master.Id
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
            """;
        var items = new List<MedicineMasterDto>();
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        AddQueryParameters(command, query);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);
        var total = reader.GetInt32(0);
        await reader.NextResultAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) items.Add(Read(reader));
        return new PagedResponse<MedicineMasterDto>(items, query.Page, query.PageSize, total);
    }

    public async Task<MedicineMasterDto?> GetByIdAsync(long id, CancellationToken cancellationToken)
    {
        var sql = $"SELECT {Columns} FROM dbo.MedicineMasters master WHERE master.Id=@Id AND master.IsDeleted=0;";
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? Read(reader) : null;
    }

    public async Task<MedicineMasterDto> CreateAsync(CreateMedicineMasterRequest request, long userId, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO dbo.MedicineMasters (MasterType, Name, Description, CreatedByUserId)
            OUTPUT INSERTED.Id VALUES (@Type, @Name, @Description, @UserId);
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        AddWriteParameters(command, request.Name, request.Description, userId);
        command.Parameters.Add("@Type", SqlDbType.NVarChar, 30).Value = request.Type;
        try
        {
            var id = Convert.ToInt64(await command.ExecuteScalarAsync(cancellationToken));
            return (await GetByIdAsync(id, cancellationToken))!;
        }
        catch (SqlException exception) when (exception.Number is 2601 or 2627)
        { throw new InvalidOperationException("An active master with this name already exists.", exception); }
    }

    public async Task<MedicineMasterWriteResult> UpdateAsync(long id, UpdateMedicineMasterRequest request, long userId, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE dbo.MedicineMasters SET Name=@Name, Description=@Description, IsActive=@IsActive,
                UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME()
            WHERE Id=@Id AND IsDeleted=0 AND RowVersion=@RowVersion;
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        AddWriteParameters(command, request.Name, request.Description, userId);
        command.Parameters.Add("@IsActive", SqlDbType.Bit).Value = request.IsActive;
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        command.Parameters.Add("@RowVersion", SqlDbType.Timestamp).Value = Convert.FromBase64String(request.RowVersion);
        try
        {
            if (await command.ExecuteNonQueryAsync(cancellationToken) > 0) return new MedicineMasterWriteResult(true);
        }
        catch (SqlException exception) when (exception.Number is 2601 or 2627)
        { throw new InvalidOperationException("An active master with this name already exists.", exception); }
        await using var existsCommand = new SqlCommand("SELECT COUNT(1) FROM dbo.MedicineMasters WHERE Id=@Id AND IsDeleted=0;", connection);
        existsCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        return Convert.ToInt32(await existsCommand.ExecuteScalarAsync(cancellationToken)) > 0
            ? new MedicineMasterWriteResult(false, Conflict: true)
            : new MedicineMasterWriteResult(false, NotFound: true);
    }

    public async Task<bool> SoftDeleteAsync(long id, long userId, CancellationToken cancellationToken)
    {
        const string sql = "UPDATE dbo.MedicineMasters SET IsDeleted=1, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME() WHERE Id=@Id AND IsDeleted=0;";
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        command.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
        return await command.ExecuteNonQueryAsync(cancellationToken) > 0;
    }

    private static void AddQueryParameters(SqlCommand command, MedicineMasterQuery query)
    {
        command.Parameters.Add("@Type", SqlDbType.NVarChar, 30).Value = (object?)query.Type ?? DBNull.Value;
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 160).Value = (object?)query.Search ?? DBNull.Value;
        command.Parameters.Add("@SearchLike", SqlDbType.NVarChar, 170).Value = query.Search is null ? DBNull.Value : $"%{query.Search}%";
        command.Parameters.Add("@Offset", SqlDbType.Int).Value = (query.Page - 1) * query.PageSize;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = query.PageSize;
    }

    private static void AddWriteParameters(SqlCommand command, string name, string? description, long userId)
    {
        command.Parameters.Add("@Name", SqlDbType.NVarChar, 160).Value = name;
        command.Parameters.Add("@Description", SqlDbType.NVarChar, 300).Value = (object?)description ?? DBNull.Value;
        command.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
    }

    private static MedicineMasterDto Read(SqlDataReader reader)
    {
        var id = reader.GetInt64(0);
        var type = reader.GetString(1);
        var prefix = type switch { "Category" => "CAT", "Manufacturer" => "MFG", _ => "GEN" };
        return new MedicineMasterDto(id, $"{prefix}-{id:0000}", type, reader.GetString(2), reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
            reader.GetInt32(7), reader.GetBoolean(4), DateTime.SpecifyKind(reader.GetDateTime(5), DateTimeKind.Utc), Convert.ToBase64String((byte[])reader[6]));
    }
}
