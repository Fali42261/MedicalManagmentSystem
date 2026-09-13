using System.Data;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Operations;
using Microsoft.Data.SqlClient;

namespace MediDesk.Data.Repositories;

public sealed class SaleRepository(SqlConnectionFactory connectionFactory) : ISaleRepository
{
    public async Task<PagedResponse<SaleSummaryDto>> GetPageAsync(SaleQuery query, CancellationToken cancellationToken)
    {
        const string where = "sale.IsDeleted=0 AND (@PaymentMethod IS NULL OR sale.PaymentMethod=@PaymentMethod) AND (@Search IS NULL OR sale.CustomerName LIKE @SearchLike OR sale.CustomerPhone LIKE @SearchLike OR CONCAT('INV-', YEAR(sale.CreatedAtUtc), '-', RIGHT('000000'+CAST(sale.Id AS VARCHAR(6)),6)) LIKE @SearchLike)";
        var sql = $"""
            SELECT COUNT(1) FROM dbo.Sales sale WHERE {where};

            SELECT sale.Id, sale.CustomerName, sale.CustomerPhone, COUNT(item.Id), sale.GrossAmount,
                   sale.DiscountTotal, sale.TaxableAmount, sale.TaxTotal, sale.GrandTotal, sale.AmountReceived,
                   sale.AmountDue, sale.ChangeAmount, sale.PaymentMethod, sale.PaymentStatus, sale.Status, sale.CreatedAtUtc
            FROM dbo.Sales sale
            LEFT JOIN dbo.SaleItems item ON item.SaleId=sale.Id AND item.IsDeleted=0
            WHERE {where}
            GROUP BY sale.Id, sale.CustomerName, sale.CustomerPhone, sale.GrossAmount, sale.DiscountTotal,
                     sale.TaxableAmount, sale.TaxTotal, sale.GrandTotal, sale.AmountReceived, sale.AmountDue,
                     sale.ChangeAmount, sale.PaymentMethod, sale.PaymentStatus, sale.Status, sale.CreatedAtUtc
            ORDER BY sale.CreatedAtUtc DESC, sale.Id DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
            """;
        var items = new List<SaleSummaryDto>();
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        AddQueryParameters(command, query);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);
        var total = reader.GetInt32(0);
        await reader.NextResultAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) items.Add(ReadSummary(reader));
        return new PagedResponse<SaleSummaryDto>(items, query.Page, query.PageSize, total);
    }

    public async Task<SaleDto?> GetByIdAsync(long id, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT Id, CustomerName, CustomerPhone, GrossAmount, DiscountTotal, TaxableAmount, TaxTotal,
                   GrandTotal, AmountReceived, AmountDue, ChangeAmount, PaymentMethod, PaymentStatus, Status,
                   Notes, CreatedAtUtc
            FROM dbo.Sales WHERE Id=@Id AND IsDeleted=0;

            SELECT Id, MedicineId, MedicineName, GenericName, BatchNumber, ExpiryDate, Quantity, UnitPrice,
                   GstRate, DiscountAmount, TaxableAmount, TaxAmount, LineTotal
            FROM dbo.SaleItems WHERE SaleId=@Id AND IsDeleted=0 ORDER BY Id;
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        var header = new
        {
            Id = reader.GetInt64(0), CustomerName = reader.IsDBNull(1) ? "Walk-in customer" : reader.GetString(1),
            CustomerPhone = reader.IsDBNull(2) ? string.Empty : reader.GetString(2), Gross = reader.GetDecimal(3),
            Discount = reader.GetDecimal(4), Taxable = reader.GetDecimal(5), Tax = reader.GetDecimal(6), Total = reader.GetDecimal(7),
            Received = reader.GetDecimal(8), Due = reader.GetDecimal(9), Change = reader.GetDecimal(10), Method = reader.GetString(11),
            PaymentStatus = reader.GetString(12), Status = reader.GetString(13), Notes = reader.IsDBNull(14) ? string.Empty : reader.GetString(14),
            Created = reader.GetDateTime(15)
        };
        var lines = new List<SaleLineDto>();
        await reader.NextResultAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) lines.Add(new SaleLineDto(
            reader.GetInt64(0), reader.GetInt64(1), reader.GetString(2), reader.GetString(3), reader.GetString(4),
            DateOnly.FromDateTime(reader.GetDateTime(5)), reader.GetInt32(6), reader.GetDecimal(7), reader.GetDecimal(8),
            reader.GetDecimal(9), reader.GetDecimal(10), reader.GetDecimal(11), reader.GetDecimal(12)));
        var created = DateTime.SpecifyKind(header.Created, DateTimeKind.Utc);
        return new SaleDto(header.Id, InvoiceNumber(header.Id, created), header.CustomerName, header.CustomerPhone,
            header.Gross, header.Discount, header.Taxable, header.Tax, header.Total, header.Received, header.Due,
            header.Change, header.Method, header.PaymentStatus, header.Status, header.Notes, created, lines);
    }

    public async Task<SaleDto> CreateAsync(CreateSaleRequest request, long userId, CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        try
        {
            var lines = new List<SaleLineSnapshot>();
            foreach (var requestLine in request.Items)
                lines.Add(await ReadMedicineAsync(connection, transaction, requestLine, cancellationToken));
            var gross = lines.Sum(line => line.UnitPrice * line.Quantity);
            var discount = lines.Sum(line => line.DiscountAmount);
            var taxable = lines.Sum(line => line.TaxableAmount);
            var tax = lines.Sum(line => line.TaxAmount);
            var total = lines.Sum(line => line.LineTotal);
            decimal due;
            decimal change;
            string paymentStatus;
            if (request.PaymentMethod == "Credit")
            {
                due = total;
                change = 0;
                paymentStatus = "Credit";
            }
            else
            {
                if (request.AmountReceived < total) throw new ArgumentException("Amount received cannot be lower than the bill total.");
                if (request.PaymentMethod is "UPI" or "Card" && request.AmountReceived != total)
                    throw new ArgumentException("UPI and card payments must match the bill total exactly.");
                due = 0;
                change = request.AmountReceived - total;
                paymentStatus = "Paid";
            }

            const string saleSql = """
                INSERT INTO dbo.Sales
                    (CustomerName, CustomerPhone, GrossAmount, DiscountTotal, TaxableAmount, TaxTotal, GrandTotal,
                     AmountReceived, AmountDue, ChangeAmount, PaymentMethod, PaymentStatus, Status, Notes, CreatedByUserId)
                OUTPUT INSERTED.Id, INSERTED.CreatedAtUtc
                VALUES
                    (@CustomerName, @CustomerPhone, @Gross, @Discount, @Taxable, @Tax, @Total,
                     @Received, @Due, @Change, @PaymentMethod, @PaymentStatus, 'Completed', @Notes, @UserId);
                """;
            await using var saleCommand = new SqlCommand(saleSql, connection, transaction);
            saleCommand.Parameters.Add("@CustomerName", SqlDbType.NVarChar, 160).Value = (object?)request.CustomerName ?? DBNull.Value;
            saleCommand.Parameters.Add("@CustomerPhone", SqlDbType.NVarChar, 18).Value = (object?)request.CustomerPhone ?? DBNull.Value;
            AddMoney(saleCommand, "@Gross", gross);
            AddMoney(saleCommand, "@Discount", discount);
            AddMoney(saleCommand, "@Taxable", taxable);
            AddMoney(saleCommand, "@Tax", tax);
            AddMoney(saleCommand, "@Total", total);
            AddMoney(saleCommand, "@Received", request.AmountReceived);
            AddMoney(saleCommand, "@Due", due);
            AddMoney(saleCommand, "@Change", change);
            saleCommand.Parameters.Add("@PaymentMethod", SqlDbType.NVarChar, 20).Value = request.PaymentMethod;
            saleCommand.Parameters.Add("@PaymentStatus", SqlDbType.NVarChar, 20).Value = paymentStatus;
            saleCommand.Parameters.Add("@Notes", SqlDbType.NVarChar, 500).Value = (object?)request.Notes ?? DBNull.Value;
            saleCommand.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
            await using var saleReader = await saleCommand.ExecuteReaderAsync(cancellationToken);
            await saleReader.ReadAsync(cancellationToken);
            var saleId = saleReader.GetInt64(0);
            var createdAt = DateTime.SpecifyKind(saleReader.GetDateTime(1), DateTimeKind.Utc);
            await saleReader.DisposeAsync();
            var invoiceNumber = InvoiceNumber(saleId, createdAt);

            foreach (var line in lines)
                await SellLineAsync(connection, transaction, saleId, invoiceNumber, line, userId, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return (await GetByIdAsync(saleId, cancellationToken))!;
        }
        catch
        {
            if (transaction.Connection is not null) await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<bool> CancelAsync(long id, long userId, CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        try
        {
            const string headerSql = "SELECT CreatedAtUtc FROM dbo.Sales WITH (UPDLOCK, ROWLOCK) WHERE Id=@Id AND IsDeleted=0;";
            await using var headerCommand = new SqlCommand(headerSql, connection, transaction);
            headerCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
            var createdValue = await headerCommand.ExecuteScalarAsync(cancellationToken);
            if (createdValue is null) { await transaction.RollbackAsync(cancellationToken); return false; }
            var reference = InvoiceNumber(id, DateTime.SpecifyKind(Convert.ToDateTime(createdValue), DateTimeKind.Utc));
            var lines = new List<(long MedicineId, int Quantity)>();
            await using (var itemCommand = new SqlCommand("SELECT MedicineId, Quantity FROM dbo.SaleItems WHERE SaleId=@Id AND IsDeleted=0;", connection, transaction))
            {
                itemCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
                await using var reader = await itemCommand.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken)) lines.Add((reader.GetInt64(0), reader.GetInt32(1)));
            }
            foreach (var line in lines)
                await RestoreLineAsync(connection, transaction, line.MedicineId, line.Quantity, reference, userId, cancellationToken);

            const string cancelSql = """
                UPDATE dbo.Sales SET IsDeleted=1, Status='Cancelled', CancelledByUserId=@UserId,
                    CancelledAtUtc=SYSUTCDATETIME(), UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME()
                WHERE Id=@Id AND IsDeleted=0;
                UPDATE dbo.SaleItems SET IsDeleted=1 WHERE SaleId=@Id AND IsDeleted=0;
                """;
            await using var cancelCommand = new SqlCommand(cancelSql, connection, transaction);
            cancelCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
            cancelCommand.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
            await cancelCommand.ExecuteNonQueryAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return true;
        }
        catch
        {
            if (transaction.Connection is not null) await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static async Task<SaleLineSnapshot> ReadMedicineAsync(SqlConnection connection, SqlTransaction transaction, SaleLineRequest line, CancellationToken cancellationToken)
    {
        const string sql = "SELECT Name, GenericName, BatchNumber, ExpiryDate, SalePrice, GstRate, Stock FROM dbo.Medicines WITH (UPDLOCK, ROWLOCK) WHERE Id=@Id AND IsDeleted=0;";
        await using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = line.MedicineId;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) throw new KeyNotFoundException($"Medicine {line.MedicineId} not found.");
        var stock = reader.GetInt32(6);
        if (line.Quantity > stock) throw new InvalidOperationException($"Only {stock} units of {reader.GetString(0)} are available.");
        var expiry = DateOnly.FromDateTime(reader.GetDateTime(3));
        if (expiry < DateOnly.FromDateTime(DateTime.UtcNow)) throw new InvalidOperationException($"{reader.GetString(0)} batch {reader.GetString(2)} is expired.");
        var price = reader.GetDecimal(4);
        var gross = price * line.Quantity;
        if (line.DiscountAmount > gross) throw new ArgumentException("Line discount cannot exceed the line amount.");
        var lineTotal = gross - line.DiscountAmount;
        var gst = reader.GetDecimal(5);
        var taxable = gst == 0 ? lineTotal : Math.Round(lineTotal * 100m / (100m + gst), 2, MidpointRounding.AwayFromZero);
        var tax = lineTotal - taxable;
        return new SaleLineSnapshot(line.MedicineId, reader.GetString(0), reader.GetString(1), reader.GetString(2), expiry,
            line.Quantity, price, gst, line.DiscountAmount, taxable, tax, lineTotal, stock);
    }

    private static async Task SellLineAsync(SqlConnection connection, SqlTransaction transaction, long saleId, string invoiceNumber, SaleLineSnapshot line, long userId, CancellationToken cancellationToken)
    {
        const string itemSql = """
            INSERT INTO dbo.SaleItems
                (SaleId, MedicineId, MedicineName, GenericName, BatchNumber, ExpiryDate, Quantity, UnitPrice,
                 GstRate, DiscountAmount, TaxableAmount, TaxAmount, LineTotal)
            VALUES
                (@SaleId, @MedicineId, @Name, @Generic, @Batch, @Expiry, @Quantity, @Price,
                 @Gst, @Discount, @Taxable, @Tax, @Total);
            """;
        await using (var command = new SqlCommand(itemSql, connection, transaction))
        {
            command.Parameters.Add("@SaleId", SqlDbType.BigInt).Value = saleId;
            command.Parameters.Add("@MedicineId", SqlDbType.BigInt).Value = line.MedicineId;
            command.Parameters.Add("@Name", SqlDbType.NVarChar, 160).Value = line.Name;
            command.Parameters.Add("@Generic", SqlDbType.NVarChar, 160).Value = line.Generic;
            command.Parameters.Add("@Batch", SqlDbType.NVarChar, 80).Value = line.Batch;
            command.Parameters.Add("@Expiry", SqlDbType.Date).Value = line.Expiry.ToDateTime(TimeOnly.MinValue);
            command.Parameters.Add("@Quantity", SqlDbType.Int).Value = line.Quantity;
            AddMoney(command, "@Price", line.UnitPrice);
            AddMoney(command, "@Gst", line.GstRate, 5);
            AddMoney(command, "@Discount", line.DiscountAmount);
            AddMoney(command, "@Taxable", line.TaxableAmount);
            AddMoney(command, "@Tax", line.TaxAmount);
            AddMoney(command, "@Total", line.LineTotal);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        var nextStock = line.PreviousStock - line.Quantity;
        await using (var command = new SqlCommand("UPDATE dbo.Medicines SET Stock=@Stock, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME() WHERE Id=@Id AND IsDeleted=0;", connection, transaction))
        {
            command.Parameters.Add("@Stock", SqlDbType.Int).Value = nextStock;
            command.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
            command.Parameters.Add("@Id", SqlDbType.BigInt).Value = line.MedicineId;
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        await InsertMovementAsync(connection, transaction, line.MedicineId, "Sale", -line.Quantity, line.PreviousStock,
            nextStock, "Stock issued against sales invoice.", invoiceNumber, userId, cancellationToken);
    }

    private static async Task RestoreLineAsync(SqlConnection connection, SqlTransaction transaction, long medicineId, int quantity, string reference, long userId, CancellationToken cancellationToken)
    {
        await using var stockCommand = new SqlCommand("SELECT Stock FROM dbo.Medicines WITH (UPDLOCK, ROWLOCK) WHERE Id=@Id AND IsDeleted=0;", connection, transaction);
        stockCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = medicineId;
        var value = await stockCommand.ExecuteScalarAsync(cancellationToken);
        if (value is null) throw new InvalidOperationException("A sold medicine is no longer available, so the invoice cannot be cancelled.");
        var previous = Convert.ToInt32(value);
        var next = checked(previous + quantity);
        await using (var updateCommand = new SqlCommand("UPDATE dbo.Medicines SET Stock=@Stock, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME() WHERE Id=@Id;", connection, transaction))
        {
            updateCommand.Parameters.Add("@Stock", SqlDbType.Int).Value = next;
            updateCommand.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
            updateCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = medicineId;
            await updateCommand.ExecuteNonQueryAsync(cancellationToken);
        }
        await InsertMovementAsync(connection, transaction, medicineId, "Sale cancellation", quantity, previous, next,
            "Stock restored for cancelled sales invoice.", reference, userId, cancellationToken);
    }

    private static async Task InsertMovementAsync(SqlConnection connection, SqlTransaction transaction, long medicineId, string type,
        int change, int previous, int next, string reason, string reference, long userId, CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO dbo.InventoryMovements
                (MedicineId, MovementType, QuantityChange, PreviousStock, NewStock, Reason, ReferenceNumber, CreatedByUserId)
            VALUES (@MedicineId, @Type, @Change, @Previous, @Next, @Reason, @Reference, @UserId);
            """;
        await using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.Add("@MedicineId", SqlDbType.BigInt).Value = medicineId;
        command.Parameters.Add("@Type", SqlDbType.NVarChar, 40).Value = type;
        command.Parameters.Add("@Change", SqlDbType.Int).Value = change;
        command.Parameters.Add("@Previous", SqlDbType.Int).Value = previous;
        command.Parameters.Add("@Next", SqlDbType.Int).Value = next;
        command.Parameters.Add("@Reason", SqlDbType.NVarChar, 300).Value = reason;
        command.Parameters.Add("@Reference", SqlDbType.NVarChar, 80).Value = reference;
        command.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static void AddQueryParameters(SqlCommand command, SaleQuery query)
    {
        command.Parameters.Add("@PaymentMethod", SqlDbType.NVarChar, 20).Value = (object?)query.PaymentMethod ?? DBNull.Value;
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 160).Value = (object?)query.Search ?? DBNull.Value;
        command.Parameters.Add("@SearchLike", SqlDbType.NVarChar, 170).Value = query.Search is null ? DBNull.Value : $"%{query.Search}%";
        command.Parameters.Add("@Offset", SqlDbType.Int).Value = (query.Page - 1) * query.PageSize;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = query.PageSize;
    }

    private static void AddMoney(SqlCommand command, string name, decimal value, byte precision = 18)
    {
        var parameter = command.Parameters.Add(name, SqlDbType.Decimal);
        parameter.Precision = precision;
        parameter.Scale = 2;
        parameter.Value = value;
    }

    private static SaleSummaryDto ReadSummary(SqlDataReader reader)
    {
        var id = reader.GetInt64(0);
        var created = DateTime.SpecifyKind(reader.GetDateTime(15), DateTimeKind.Utc);
        return new SaleSummaryDto(id, InvoiceNumber(id, created), reader.IsDBNull(1) ? "Walk-in customer" : reader.GetString(1),
            reader.IsDBNull(2) ? string.Empty : reader.GetString(2), reader.GetInt32(3), reader.GetDecimal(4), reader.GetDecimal(5),
            reader.GetDecimal(6), reader.GetDecimal(7), reader.GetDecimal(8), reader.GetDecimal(9), reader.GetDecimal(10),
            reader.GetDecimal(11), reader.GetString(12), reader.GetString(13), reader.GetString(14), created);
    }

    private static string InvoiceNumber(long id, DateTime createdAt) => $"INV-{createdAt.Year}-{id:000000}";

    private sealed record SaleLineSnapshot(long MedicineId, string Name, string Generic, string Batch, DateOnly Expiry,
        int Quantity, decimal UnitPrice, decimal GstRate, decimal DiscountAmount, decimal TaxableAmount,
        decimal TaxAmount, decimal LineTotal, int PreviousStock);
}
