using System.Data;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using Microsoft.Data.SqlClient;

namespace MediDesk.Data.Repositories;

public sealed class InventoryRepository(SqlConnectionFactory connectionFactory) : IInventoryRepository
{
    public async Task<IReadOnlyCollection<StockMovementDto>> GetRecentMovementsAsync(int take, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT TOP (@Take) movement.Id, movement.MedicineId, medicine.Name, medicine.BatchNumber,
                   movement.MovementType, movement.QuantityChange, movement.PreviousStock, movement.NewStock,
                   movement.Reason, movement.ReferenceNumber, [user].FullName, movement.CreatedAtUtc
            FROM dbo.InventoryMovements movement
            INNER JOIN dbo.Medicines medicine ON medicine.Id=movement.MedicineId
            INNER JOIN dbo.Users [user] ON [user].Id=movement.CreatedByUserId
            ORDER BY movement.Id DESC;
            """;
        var movements = new List<StockMovementDto>();
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Take", SqlDbType.Int).Value = take;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) movements.Add(Read(reader));
        return movements;
    }

    public async Task<StockMovementDto> AdjustAsync(StockAdjustmentRequest request, long userId, CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        try
        {
            const string stockSql = "SELECT Stock FROM dbo.Medicines WITH (UPDLOCK, ROWLOCK) WHERE Id=@MedicineId AND IsDeleted=0;";
            await using var stockCommand = new SqlCommand(stockSql, connection, transaction);
            stockCommand.Parameters.Add("@MedicineId", SqlDbType.BigInt).Value = request.MedicineId;
            var stockValue = await stockCommand.ExecuteScalarAsync(cancellationToken);
            if (stockValue is null) throw new KeyNotFoundException("Medicine not found.");
            var previousStock = Convert.ToInt32(stockValue);
            var newStock = request.AdjustmentType switch
            {
                "Add stock" => checked(previousStock + request.Quantity),
                "Remove stock" => previousStock - request.Quantity,
                _ => request.Quantity
            };
            if (newStock < 0) throw new InvalidOperationException("Stock cannot become negative.");
            var change = newStock - previousStock;
            if (change == 0) throw new InvalidOperationException("The adjustment does not change current stock.");

            const string updateSql = """
                UPDATE dbo.Medicines SET Stock=@NewStock, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME()
                WHERE Id=@MedicineId AND IsDeleted=0;
                """;
            await using var updateCommand = new SqlCommand(updateSql, connection, transaction);
            updateCommand.Parameters.Add("@NewStock", SqlDbType.Int).Value = newStock;
            updateCommand.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
            updateCommand.Parameters.Add("@MedicineId", SqlDbType.BigInt).Value = request.MedicineId;
            await updateCommand.ExecuteNonQueryAsync(cancellationToken);

            const string movementSql = """
                INSERT INTO dbo.InventoryMovements
                    (MedicineId, MovementType, QuantityChange, PreviousStock, NewStock, Reason, ReferenceNumber, CreatedByUserId)
                OUTPUT INSERTED.Id, INSERTED.CreatedAtUtc
                VALUES (@MedicineId, @MovementType, @QuantityChange, @PreviousStock, @NewStock, @Reason, @ReferenceNumber, @UserId);
                """;
            await using var movementCommand = new SqlCommand(movementSql, connection, transaction);
            movementCommand.Parameters.Add("@MedicineId", SqlDbType.BigInt).Value = request.MedicineId;
            movementCommand.Parameters.Add("@MovementType", SqlDbType.NVarChar, 40).Value = request.AdjustmentType;
            movementCommand.Parameters.Add("@QuantityChange", SqlDbType.Int).Value = change;
            movementCommand.Parameters.Add("@PreviousStock", SqlDbType.Int).Value = previousStock;
            movementCommand.Parameters.Add("@NewStock", SqlDbType.Int).Value = newStock;
            movementCommand.Parameters.Add("@Reason", SqlDbType.NVarChar, 300).Value = request.Reason;
            movementCommand.Parameters.Add("@ReferenceNumber", SqlDbType.NVarChar, 80).Value = (object?)request.ReferenceNumber ?? DBNull.Value;
            movementCommand.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
            await using var reader = await movementCommand.ExecuteReaderAsync(cancellationToken);
            await reader.ReadAsync(cancellationToken);
            var movementId = reader.GetInt64(0);
            var createdAt = reader.GetDateTime(1);
            await reader.DisposeAsync();
            await transaction.CommitAsync(cancellationToken);

            return await GetMovementAsync(movementId, createdAt, cancellationToken);
        }
        catch
        {
            if (transaction.Connection is not null)
                await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<StockMovementDto> GetMovementAsync(long id, DateTime createdAt, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT movement.Id, movement.MedicineId, medicine.Name, medicine.BatchNumber,
                   movement.MovementType, movement.QuantityChange, movement.PreviousStock, movement.NewStock,
                   movement.Reason, movement.ReferenceNumber, [user].FullName, movement.CreatedAtUtc
            FROM dbo.InventoryMovements movement
            INNER JOIN dbo.Medicines medicine ON medicine.Id=movement.MedicineId
            INNER JOIN dbo.Users [user] ON [user].Id=movement.CreatedByUserId
            WHERE movement.Id=@Id;
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) throw new InvalidOperationException($"Movement {id} created at {createdAt:O} was not found.");
        return Read(reader);
    }

    private static StockMovementDto Read(SqlDataReader reader) => new(
        reader.GetInt64(0), reader.GetInt64(1), reader.GetString(2), reader.GetString(3), reader.GetString(4),
        reader.GetInt32(5), reader.GetInt32(6), reader.GetInt32(7), reader.GetString(8),
        reader.IsDBNull(9) ? null : reader.GetString(9), reader.GetString(10),
        DateTime.SpecifyKind(reader.GetDateTime(11), DateTimeKind.Utc));
}
