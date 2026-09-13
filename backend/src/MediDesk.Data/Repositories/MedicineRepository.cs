using System.Data;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using Microsoft.Data.SqlClient;

namespace MediDesk.Data.Repositories;

public sealed class MedicineRepository(SqlConnectionFactory connectionFactory) : IMedicineRepository
{
    private const string Columns = """
        m.Id, m.Name, m.GenericName, m.Category, m.Manufacturer, m.DosageForm, m.Strength,
        m.BatchNumber, m.ExpiryDate, m.PurchasePrice, m.SalePrice, m.Stock, m.MinimumStock,
        m.GstRate, m.RackNumber,
        CASE WHEN m.ExpiryDate <= DATEADD(DAY, 90, CAST(SYSUTCDATETIME() AS DATE)) THEN 'Expiring'
             WHEN m.Stock <= m.MinimumStock THEN 'Low stock' ELSE 'In stock' END AS [Status],
        m.RowVersion
        """;

    public async Task<PagedResponse<MedicineDto>> GetPageAsync(MedicineQuery query, CancellationToken cancellationToken)
    {
        var orderColumn = (query.SortBy ?? string.Empty).ToLowerInvariant() switch
        {
            "category" => "m.Category", "stock" => "m.Stock", "purchase" => "m.PurchasePrice",
            "sale" => "m.SalePrice", "status" => "[Status]", _ => "m.Name"
        };
        var direction = string.Equals(query.SortDirection, "desc", StringComparison.OrdinalIgnoreCase) ? "DESC" : "ASC";
        var statusExpression = "CASE WHEN m.ExpiryDate <= DATEADD(DAY, 90, CAST(SYSUTCDATETIME() AS DATE)) THEN 'Expiring' WHEN m.Stock <= m.MinimumStock THEN 'Low stock' ELSE 'In stock' END";
        var where = $"""
            m.IsDeleted=0
            AND (@Search IS NULL OR m.Name LIKE @SearchLike OR m.GenericName LIKE @SearchLike OR m.BatchNumber LIKE @SearchLike)
            AND (@Status IS NULL OR {statusExpression}=@Status)
            """;
        var sql = $"""
            SELECT COUNT(1) FROM dbo.Medicines m WHERE {where};
            SELECT {Columns} FROM dbo.Medicines m WHERE {where}
            ORDER BY {orderColumn} {direction}, m.Id
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
            """;

        var items = new List<MedicineDto>();
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        AddQueryParameters(command, query);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);
        var total = reader.GetInt32(0);
        await reader.NextResultAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) items.Add(Read(reader));
        return new PagedResponse<MedicineDto>(items, query.Page, query.PageSize, total);
    }

    public async Task<MedicineDto?> GetByIdAsync(long id, CancellationToken cancellationToken)
    {
        var sql = $"SELECT {Columns} FROM dbo.Medicines m WHERE m.Id=@Id AND m.IsDeleted=0;";
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? Read(reader) : null;
    }

    public async Task<MedicineDto> CreateAsync(CreateMedicineRequest request, long userId, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO dbo.Medicines
                (Name, GenericName, Category, Manufacturer, DosageForm, Strength, BatchNumber, ExpiryDate,
                 PurchasePrice, SalePrice, Stock, MinimumStock, GstRate, RackNumber, CreatedByUserId)
            OUTPUT INSERTED.Id
            VALUES
                (@Name, @Generic, @Category, @Manufacturer, @DosageForm, @Strength, @Batch, @ExpiryDate,
                 @Purchase, @Sale, @Stock, @MinStock, @Gst, @Rack, @UserId);
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection, transaction);
        AddWriteParameters(command, request.Name, request.Generic, request.Category, request.Manufacturer, request.DosageForm,
            request.Strength, request.Batch, request.ExpiryDate, request.Purchase, request.Sale, request.Stock, request.MinStock,
            request.Gst, request.Rack, userId);
        long id;
        try
        {
            id = Convert.ToInt64(await command.ExecuteScalarAsync(cancellationToken));
            if (request.Stock > 0)
            {
                const string movementSql = """
                    INSERT INTO dbo.InventoryMovements
                        (MedicineId, MovementType, QuantityChange, PreviousStock, NewStock, Reason, CreatedByUserId)
                    VALUES (@MedicineId, 'Opening stock', @Stock, 0, @Stock, 'Opening stock recorded with medicine', @UserId);
                    """;
                await using var movementCommand = new SqlCommand(movementSql, connection, transaction);
                movementCommand.Parameters.Add("@MedicineId", SqlDbType.BigInt).Value = id;
                movementCommand.Parameters.Add("@Stock", SqlDbType.Int).Value = request.Stock;
                movementCommand.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
                await movementCommand.ExecuteNonQueryAsync(cancellationToken);
            }
            await transaction.CommitAsync(cancellationToken);
        }
        catch (SqlException exception) when (exception.Number is 2601 or 2627)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new InvalidOperationException("An active medicine with this batch number already exists.", exception);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task<MedicineWriteResult> UpdateAsync(long id, UpdateMedicineRequest request, long userId, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE dbo.Medicines SET
                Name=@Name, GenericName=@Generic, Category=@Category, Manufacturer=@Manufacturer,
                DosageForm=@DosageForm, Strength=@Strength, BatchNumber=@Batch, ExpiryDate=@ExpiryDate,
                PurchasePrice=@Purchase, SalePrice=@Sale, Stock=@Stock, MinimumStock=@MinStock,
                GstRate=@Gst, RackNumber=@Rack, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME()
            WHERE Id=@Id AND IsDeleted=0 AND RowVersion=@RowVersion;
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        AddWriteParameters(command, request.Name, request.Generic, request.Category, request.Manufacturer, request.DosageForm,
            request.Strength, request.Batch, request.ExpiryDate, request.Purchase, request.Sale, request.Stock, request.MinStock,
            request.Gst, request.Rack, userId);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        command.Parameters.Add("@RowVersion", SqlDbType.Timestamp).Value = Convert.FromBase64String(request.RowVersion);
        try
        {
            if (await command.ExecuteNonQueryAsync(cancellationToken) > 0) return new MedicineWriteResult(true);
        }
        catch (SqlException exception) when (exception.Number is 2601 or 2627)
        { throw new InvalidOperationException("An active medicine with this batch number already exists.", exception); }

        await using var existsCommand = new SqlCommand("SELECT COUNT(1) FROM dbo.Medicines WHERE Id=@Id AND IsDeleted=0;", connection);
        existsCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        var exists = Convert.ToInt32(await existsCommand.ExecuteScalarAsync(cancellationToken)) > 0;
        return exists ? new MedicineWriteResult(false, Conflict: true) : new MedicineWriteResult(false, NotFound: true);
    }

    public async Task<bool> SoftDeleteAsync(long id, long userId, CancellationToken cancellationToken)
    {
        const string sql = """
            UPDATE dbo.Medicines SET IsDeleted=1, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME()
            WHERE Id=@Id AND IsDeleted=0;
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        command.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
        return await command.ExecuteNonQueryAsync(cancellationToken) > 0;
    }

    private static void AddQueryParameters(SqlCommand command, MedicineQuery query)
    {
        var search = string.IsNullOrWhiteSpace(query.Search) ? null : query.Search;
        var status = string.IsNullOrWhiteSpace(query.Status) || query.Status.Equals("All status", StringComparison.OrdinalIgnoreCase) ? null : query.Status;
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 160).Value = (object?)search ?? DBNull.Value;
        command.Parameters.Add("@SearchLike", SqlDbType.NVarChar, 170).Value = search is null ? DBNull.Value : $"%{search}%";
        command.Parameters.Add("@Status", SqlDbType.NVarChar, 20).Value = (object?)status ?? DBNull.Value;
        command.Parameters.Add("@Offset", SqlDbType.Int).Value = (query.Page - 1) * query.PageSize;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = query.PageSize;
    }

    private static void AddWriteParameters(SqlCommand command, string name, string generic, string category, string? manufacturer,
        string? dosageForm, string? strength, string batch, DateOnly expiryDate, decimal purchase, decimal sale, int stock,
        int minStock, decimal gst, string? rack, long userId)
    {
        command.Parameters.Add("@Name", SqlDbType.NVarChar, 160).Value = name;
        command.Parameters.Add("@Generic", SqlDbType.NVarChar, 160).Value = generic;
        command.Parameters.Add("@Category", SqlDbType.NVarChar, 80).Value = category;
        command.Parameters.Add("@Manufacturer", SqlDbType.NVarChar, 160).Value = manufacturer ?? string.Empty;
        command.Parameters.Add("@DosageForm", SqlDbType.NVarChar, 40).Value = dosageForm ?? string.Empty;
        command.Parameters.Add("@Strength", SqlDbType.NVarChar, 40).Value = strength ?? string.Empty;
        command.Parameters.Add("@Batch", SqlDbType.NVarChar, 80).Value = batch;
        command.Parameters.Add("@ExpiryDate", SqlDbType.Date).Value = expiryDate.ToDateTime(TimeOnly.MinValue);
        command.Parameters.Add("@Purchase", SqlDbType.Decimal).Value = purchase;
        command.Parameters["@Purchase"].Precision = 18; command.Parameters["@Purchase"].Scale = 2;
        command.Parameters.Add("@Sale", SqlDbType.Decimal).Value = sale;
        command.Parameters["@Sale"].Precision = 18; command.Parameters["@Sale"].Scale = 2;
        command.Parameters.Add("@Stock", SqlDbType.Int).Value = stock;
        command.Parameters.Add("@MinStock", SqlDbType.Int).Value = minStock;
        command.Parameters.Add("@Gst", SqlDbType.Decimal).Value = gst;
        command.Parameters["@Gst"].Precision = 5; command.Parameters["@Gst"].Scale = 2;
        command.Parameters.Add("@Rack", SqlDbType.NVarChar, 40).Value = rack ?? string.Empty;
        command.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
    }

    private static MedicineDto Read(SqlDataReader reader) => new(
        reader.GetInt64(0), reader.GetString(1), reader.GetString(2), reader.GetString(3), reader.GetString(4),
        reader.GetString(5), reader.GetString(6), reader.GetString(7), DateOnly.FromDateTime(reader.GetDateTime(8)),
        reader.GetDecimal(9), reader.GetDecimal(10), reader.GetInt32(11), reader.GetInt32(12), reader.GetDecimal(13),
        reader.GetString(14), reader.GetString(15), Convert.ToBase64String((byte[])reader[16]));
}
