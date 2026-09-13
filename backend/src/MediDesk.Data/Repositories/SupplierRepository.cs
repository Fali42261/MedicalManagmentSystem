using System.Data;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Partners;
using Microsoft.Data.SqlClient;

namespace MediDesk.Data.Repositories;

public sealed class SupplierRepository(SqlConnectionFactory connectionFactory) : ISupplierRepository
{
    private const string Columns = "supplier.Id, supplier.BusinessName, supplier.ContactPerson, supplier.Phone, supplier.Email, supplier.Gstin, supplier.DrugLicenseNumber, supplier.Address, supplier.City, supplier.State, supplier.PostalCode, supplier.OutstandingBalance, supplier.IsActive, COALESCE(supplier.UpdatedAtUtc, supplier.CreatedAtUtc), supplier.RowVersion";

    public async Task<PagedResponse<SupplierDto>> GetPageAsync(SupplierQuery query, CancellationToken cancellationToken)
    {
        const string where = "supplier.IsDeleted=0 AND (@Status IS NULL OR supplier.IsActive=CASE WHEN @Status='Active' THEN 1 ELSE 0 END) AND (@Search IS NULL OR supplier.BusinessName LIKE @SearchLike OR supplier.ContactPerson LIKE @SearchLike OR supplier.Phone LIKE @SearchLike OR supplier.Gstin LIKE @SearchLike OR supplier.City LIKE @SearchLike)";
        var sql = $"""
            SELECT COUNT(1) FROM dbo.Suppliers supplier WHERE {where};
            SELECT {Columns} FROM dbo.Suppliers supplier WHERE {where}
            ORDER BY supplier.BusinessName, supplier.Id
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
            """;
        var items = new List<SupplierDto>();
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        AddQueryParameters(command, query);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);
        var total = reader.GetInt32(0);
        await reader.NextResultAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) items.Add(Read(reader));
        return new PagedResponse<SupplierDto>(items, query.Page, query.PageSize, total);
    }

    public async Task<SupplierDto?> GetByIdAsync(long id, CancellationToken cancellationToken)
    {
        var sql = $"SELECT {Columns} FROM dbo.Suppliers supplier WHERE supplier.Id=@Id AND supplier.IsDeleted=0;";
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? Read(reader) : null;
    }

    public async Task<SupplierDto> CreateAsync(CreateSupplierRequest request, long userId, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO dbo.Suppliers
                (BusinessName, ContactPerson, Phone, Email, Gstin, DrugLicenseNumber, Address, City, State, PostalCode, OutstandingBalance, CreatedByUserId)
            OUTPUT INSERTED.Id
            VALUES
                (@BusinessName, @ContactPerson, @Phone, @Email, @Gstin, @DrugLicenseNumber, @Address, @City, @State, @PostalCode, @OutstandingBalance, @UserId);
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        AddWriteParameters(command, request.BusinessName, request.ContactPerson, request.Phone, request.Email, request.Gstin,
            request.DrugLicenseNumber, request.Address, request.City, request.State, request.PostalCode, userId);
        command.Parameters.Add("@OutstandingBalance", SqlDbType.Decimal).Value = request.OpeningBalance;
        command.Parameters["@OutstandingBalance"].Precision = 18;
        command.Parameters["@OutstandingBalance"].Scale = 2;
        try
        {
            var id = Convert.ToInt64(await command.ExecuteScalarAsync(cancellationToken));
            return (await GetByIdAsync(id, cancellationToken))!;
        }
        catch (SqlException exception) when (exception.Number is 2601 or 2627)
        { throw new InvalidOperationException("A supplier with this business name or GSTIN already exists.", exception); }
    }

    public async Task<SupplierWriteResult> UpdateAsync(long id, UpdateSupplierRequest request, long userId, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE dbo.Suppliers SET BusinessName=@BusinessName, ContactPerson=@ContactPerson, Phone=@Phone, Email=@Email,
                Gstin=@Gstin, DrugLicenseNumber=@DrugLicenseNumber, Address=@Address, City=@City, State=@State,
                PostalCode=@PostalCode, IsActive=@IsActive, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME()
            WHERE Id=@Id AND IsDeleted=0 AND RowVersion=@RowVersion;
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        AddWriteParameters(command, request.BusinessName, request.ContactPerson, request.Phone, request.Email, request.Gstin,
            request.DrugLicenseNumber, request.Address, request.City, request.State, request.PostalCode, userId);
        command.Parameters.Add("@IsActive", SqlDbType.Bit).Value = request.IsActive;
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        command.Parameters.Add("@RowVersion", SqlDbType.Timestamp).Value = Convert.FromBase64String(request.RowVersion);
        try
        {
            if (await command.ExecuteNonQueryAsync(cancellationToken) > 0) return new SupplierWriteResult(true);
        }
        catch (SqlException exception) when (exception.Number is 2601 or 2627)
        { throw new InvalidOperationException("A supplier with this business name or GSTIN already exists.", exception); }
        await using var existsCommand = new SqlCommand("SELECT COUNT(1) FROM dbo.Suppliers WHERE Id=@Id AND IsDeleted=0;", connection);
        existsCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        return Convert.ToInt32(await existsCommand.ExecuteScalarAsync(cancellationToken)) > 0
            ? new SupplierWriteResult(false, Conflict: true)
            : new SupplierWriteResult(false, NotFound: true);
    }

    public async Task<bool> SoftDeleteAsync(long id, long userId, CancellationToken cancellationToken)
    {
        const string sql = "UPDATE dbo.Suppliers SET IsDeleted=1, IsActive=0, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME() WHERE Id=@Id AND IsDeleted=0;";
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        command.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
        return await command.ExecuteNonQueryAsync(cancellationToken) > 0;
    }

    private static void AddQueryParameters(SqlCommand command, SupplierQuery query)
    {
        command.Parameters.Add("@Status", SqlDbType.NVarChar, 10).Value = (object?)query.Status ?? DBNull.Value;
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 160).Value = (object?)query.Search ?? DBNull.Value;
        command.Parameters.Add("@SearchLike", SqlDbType.NVarChar, 170).Value = query.Search is null ? DBNull.Value : $"%{query.Search}%";
        command.Parameters.Add("@Offset", SqlDbType.Int).Value = (query.Page - 1) * query.PageSize;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = query.PageSize;
    }

    private static void AddWriteParameters(SqlCommand command, string businessName, string contactPerson, string phone, string? email,
        string? gstin, string? drugLicenseNumber, string? address, string city, string state, string? postalCode, long userId)
    {
        command.Parameters.Add("@BusinessName", SqlDbType.NVarChar, 160).Value = businessName;
        command.Parameters.Add("@ContactPerson", SqlDbType.NVarChar, 120).Value = contactPerson;
        command.Parameters.Add("@Phone", SqlDbType.NVarChar, 18).Value = phone;
        command.Parameters.Add("@Email", SqlDbType.NVarChar, 256).Value = (object?)email ?? DBNull.Value;
        command.Parameters.Add("@Gstin", SqlDbType.NVarChar, 15).Value = (object?)gstin ?? DBNull.Value;
        command.Parameters.Add("@DrugLicenseNumber", SqlDbType.NVarChar, 80).Value = (object?)drugLicenseNumber ?? DBNull.Value;
        command.Parameters.Add("@Address", SqlDbType.NVarChar, 300).Value = (object?)address ?? DBNull.Value;
        command.Parameters.Add("@City", SqlDbType.NVarChar, 100).Value = city;
        command.Parameters.Add("@State", SqlDbType.NVarChar, 100).Value = state;
        command.Parameters.Add("@PostalCode", SqlDbType.NVarChar, 6).Value = (object?)postalCode ?? DBNull.Value;
        command.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
    }

    private static SupplierDto Read(SqlDataReader reader) => new(
        reader.GetInt64(0), $"SUP-{reader.GetInt64(0):0000}", reader.GetString(1), reader.GetString(2), reader.GetString(3),
        reader.IsDBNull(4) ? string.Empty : reader.GetString(4), reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
        reader.IsDBNull(6) ? string.Empty : reader.GetString(6), reader.IsDBNull(7) ? string.Empty : reader.GetString(7),
        reader.GetString(8), reader.GetString(9), reader.IsDBNull(10) ? string.Empty : reader.GetString(10), reader.GetDecimal(11),
        reader.GetBoolean(12), DateTime.SpecifyKind(reader.GetDateTime(13), DateTimeKind.Utc), Convert.ToBase64String((byte[])reader[14]));
}
