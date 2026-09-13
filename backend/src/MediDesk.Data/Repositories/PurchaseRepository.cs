using System.Data;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Operations;
using Microsoft.Data.SqlClient;

namespace MediDesk.Data.Repositories;

public sealed class PurchaseRepository(SqlConnectionFactory connectionFactory) : IPurchaseRepository
{
    public async Task<PagedResponse<PurchaseSummaryDto>> GetPageAsync(PurchaseQuery query, CancellationToken cancellationToken)
    {
        const string where = "purchase.IsDeleted=0 AND (@PaymentStatus IS NULL OR purchase.PaymentStatus=@PaymentStatus) AND (@Search IS NULL OR purchase.SupplierInvoiceNumber LIKE @SearchLike OR supplier.BusinessName LIKE @SearchLike OR CONCAT('PUR-', YEAR(purchase.InvoiceDate), '-', RIGHT('000000'+CAST(purchase.Id AS VARCHAR(6)),6)) LIKE @SearchLike)";
        var sql = $"""
            SELECT COUNT(1)
            FROM dbo.Purchases purchase
            INNER JOIN dbo.Suppliers supplier ON supplier.Id=purchase.SupplierId
            WHERE {where};

            SELECT purchase.Id, supplier.Id, supplier.BusinessName, purchase.SupplierInvoiceNumber, purchase.InvoiceDate,
                   COUNT(item.Id), purchase.Subtotal, purchase.DiscountTotal, purchase.TaxTotal, purchase.GrandTotal,
                   purchase.AmountPaid, purchase.AmountDue, purchase.PaymentMethod, purchase.PaymentStatus,
                   purchase.Status, purchase.CreatedAtUtc
            FROM dbo.Purchases purchase
            INNER JOIN dbo.Suppliers supplier ON supplier.Id=purchase.SupplierId
            LEFT JOIN dbo.PurchaseItems item ON item.PurchaseId=purchase.Id AND item.IsDeleted=0
            WHERE {where}
            GROUP BY purchase.Id, supplier.Id, supplier.BusinessName, purchase.SupplierInvoiceNumber, purchase.InvoiceDate,
                     purchase.Subtotal, purchase.DiscountTotal, purchase.TaxTotal, purchase.GrandTotal, purchase.AmountPaid,
                     purchase.AmountDue, purchase.PaymentMethod, purchase.PaymentStatus, purchase.Status, purchase.CreatedAtUtc
            ORDER BY purchase.InvoiceDate DESC, purchase.Id DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
            """;
        var items = new List<PurchaseSummaryDto>();
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        AddQueryParameters(command, query);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        await reader.ReadAsync(cancellationToken);
        var total = reader.GetInt32(0);
        await reader.NextResultAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) items.Add(ReadSummary(reader));
        return new PagedResponse<PurchaseSummaryDto>(items, query.Page, query.PageSize, total);
    }

    public async Task<PurchaseDto?> GetByIdAsync(long id, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT purchase.Id, supplier.Id, supplier.BusinessName, purchase.SupplierInvoiceNumber, purchase.InvoiceDate,
                   purchase.Subtotal, purchase.DiscountTotal, purchase.TaxTotal, purchase.GrandTotal, purchase.AmountPaid,
                   purchase.AmountDue, purchase.PaymentMethod, purchase.PaymentStatus, purchase.Status, purchase.Notes,
                   purchase.CreatedAtUtc
            FROM dbo.Purchases purchase
            INNER JOIN dbo.Suppliers supplier ON supplier.Id=purchase.SupplierId
            WHERE purchase.Id=@Id AND purchase.IsDeleted=0;

            SELECT item.Id, item.MedicineId, item.MedicineName, item.BatchNumber, item.ExpiryDate, item.Quantity,
                   item.Rate, item.GstRate, item.DiscountAmount, item.TaxAmount, item.LineTotal
            FROM dbo.PurchaseItems item
            WHERE item.PurchaseId=@Id AND item.IsDeleted=0
            ORDER BY item.Id;
            """;
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        var header = new
        {
            Id = reader.GetInt64(0), SupplierId = reader.GetInt64(1), SupplierName = reader.GetString(2),
            SupplierInvoice = reader.GetString(3), InvoiceDate = DateOnly.FromDateTime(reader.GetDateTime(4)),
            Subtotal = reader.GetDecimal(5), Discount = reader.GetDecimal(6), Tax = reader.GetDecimal(7), Total = reader.GetDecimal(8),
            Paid = reader.GetDecimal(9), Due = reader.GetDecimal(10), Method = reader.GetString(11), PaymentStatus = reader.GetString(12),
            Status = reader.GetString(13), Notes = reader.IsDBNull(14) ? string.Empty : reader.GetString(14), Created = reader.GetDateTime(15)
        };
        var lines = new List<PurchaseLineDto>();
        await reader.NextResultAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken)) lines.Add(new PurchaseLineDto(
            reader.GetInt64(0), reader.GetInt64(1), reader.GetString(2), reader.GetString(3), DateOnly.FromDateTime(reader.GetDateTime(4)),
            reader.GetInt32(5), reader.GetDecimal(6), reader.GetDecimal(7), reader.GetDecimal(8), reader.GetDecimal(9), reader.GetDecimal(10)));
        return new PurchaseDto(header.Id, PurchaseNumber(header.Id, header.InvoiceDate), header.SupplierId, header.SupplierName,
            header.SupplierInvoice, header.InvoiceDate, header.Subtotal, header.Discount, header.Tax, header.Total, header.Paid,
            header.Due, header.Method, header.PaymentStatus, header.Status, header.Notes,
            DateTime.SpecifyKind(header.Created, DateTimeKind.Utc), lines);
    }

    public async Task<PurchaseDto> CreateAsync(CreatePurchaseRequest request, long userId, CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.Create();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        try
        {
            await EnsureSupplierAsync(connection, transaction, request.SupplierId, cancellationToken);
            var lines = new List<PurchaseLineSnapshot>();
            foreach (var requestLine in request.Items)
                lines.Add(await ReadMedicineAsync(connection, transaction, requestLine, cancellationToken));

            var subtotal = lines.Sum(line => line.Rate * line.Quantity);
            var discount = lines.Sum(line => line.DiscountAmount);
            var tax = lines.Sum(line => line.TaxAmount);
            var total = subtotal - discount + tax;
            if (request.AmountPaid > total) throw new ArgumentException("Amount paid cannot exceed the purchase total.");
            var due = total - request.AmountPaid;
            var paymentStatus = due == 0 ? "Paid" : request.AmountPaid == 0 ? "Credit" : "Part paid";

            const string purchaseSql = """
                INSERT INTO dbo.Purchases
                    (SupplierId, SupplierInvoiceNumber, InvoiceDate, Subtotal, DiscountTotal, TaxTotal, GrandTotal,
                     AmountPaid, AmountDue, PaymentMethod, PaymentStatus, Status, Notes, CreatedByUserId)
                OUTPUT INSERTED.Id
                VALUES
                    (@SupplierId, @SupplierInvoice, @InvoiceDate, @Subtotal, @Discount, @Tax, @Total,
                     @Paid, @Due, @PaymentMethod, @PaymentStatus, 'Received', @Notes, @UserId);
                """;
            await using var purchaseCommand = new SqlCommand(purchaseSql, connection, transaction);
            purchaseCommand.Parameters.Add("@SupplierId", SqlDbType.BigInt).Value = request.SupplierId;
            purchaseCommand.Parameters.Add("@SupplierInvoice", SqlDbType.NVarChar, 80).Value = request.SupplierInvoiceNumber;
            purchaseCommand.Parameters.Add("@InvoiceDate", SqlDbType.Date).Value = request.InvoiceDate.ToDateTime(TimeOnly.MinValue);
            AddMoney(purchaseCommand, "@Subtotal", subtotal);
            AddMoney(purchaseCommand, "@Discount", discount);
            AddMoney(purchaseCommand, "@Tax", tax);
            AddMoney(purchaseCommand, "@Total", total);
            AddMoney(purchaseCommand, "@Paid", request.AmountPaid);
            AddMoney(purchaseCommand, "@Due", due);
            purchaseCommand.Parameters.Add("@PaymentMethod", SqlDbType.NVarChar, 20).Value = request.PaymentMethod;
            purchaseCommand.Parameters.Add("@PaymentStatus", SqlDbType.NVarChar, 20).Value = paymentStatus;
            purchaseCommand.Parameters.Add("@Notes", SqlDbType.NVarChar, 500).Value = (object?)request.Notes ?? DBNull.Value;
            purchaseCommand.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
            var purchaseId = Convert.ToInt64(await purchaseCommand.ExecuteScalarAsync(cancellationToken));
            var purchaseNumber = PurchaseNumber(purchaseId, request.InvoiceDate);

            foreach (var line in lines)
                await ReceiveLineAsync(connection, transaction, purchaseId, purchaseNumber, line, userId, cancellationToken);

            const string balanceSql = "UPDATE dbo.Suppliers SET OutstandingBalance=OutstandingBalance+@Due, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME() WHERE Id=@SupplierId;";
            await using var balanceCommand = new SqlCommand(balanceSql, connection, transaction);
            AddMoney(balanceCommand, "@Due", due);
            balanceCommand.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
            balanceCommand.Parameters.Add("@SupplierId", SqlDbType.BigInt).Value = request.SupplierId;
            await balanceCommand.ExecuteNonQueryAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return (await GetByIdAsync(purchaseId, cancellationToken))!;
        }
        catch (SqlException exception) when (exception.Number is 2601 or 2627)
        {
            if (transaction.Connection is not null) await transaction.RollbackAsync(cancellationToken);
            throw new InvalidOperationException("This supplier invoice number already exists for the selected supplier.", exception);
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
            const string headerSql = "SELECT SupplierId, AmountDue, InvoiceDate FROM dbo.Purchases WITH (UPDLOCK, ROWLOCK) WHERE Id=@Id AND IsDeleted=0;";
            await using var headerCommand = new SqlCommand(headerSql, connection, transaction);
            headerCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
            await using var headerReader = await headerCommand.ExecuteReaderAsync(cancellationToken);
            if (!await headerReader.ReadAsync(cancellationToken)) { await headerReader.DisposeAsync(); await transaction.RollbackAsync(cancellationToken); return false; }
            var supplierId = headerReader.GetInt64(0);
            var due = headerReader.GetDecimal(1);
            var invoiceDate = DateOnly.FromDateTime(headerReader.GetDateTime(2));
            await headerReader.DisposeAsync();

            var lines = new List<(long MedicineId, int Quantity)>();
            await using (var itemCommand = new SqlCommand("SELECT MedicineId, Quantity FROM dbo.PurchaseItems WHERE PurchaseId=@Id AND IsDeleted=0;", connection, transaction))
            {
                itemCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = id;
                await using var itemReader = await itemCommand.ExecuteReaderAsync(cancellationToken);
                while (await itemReader.ReadAsync(cancellationToken)) lines.Add((itemReader.GetInt64(0), itemReader.GetInt32(1)));
            }
            var reference = PurchaseNumber(id, invoiceDate);
            foreach (var line in lines)
                await ReverseLineAsync(connection, transaction, line.MedicineId, line.Quantity, reference, userId, cancellationToken);

            const string balanceSql = "UPDATE dbo.Suppliers SET OutstandingBalance=OutstandingBalance-@Due, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME() WHERE Id=@SupplierId AND OutstandingBalance>=@Due;";
            await using var balanceCommand = new SqlCommand(balanceSql, connection, transaction);
            AddMoney(balanceCommand, "@Due", due);
            balanceCommand.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
            balanceCommand.Parameters.Add("@SupplierId", SqlDbType.BigInt).Value = supplierId;
            if (await balanceCommand.ExecuteNonQueryAsync(cancellationToken) == 0)
                throw new InvalidOperationException("Supplier balance has changed and this purchase cannot be cancelled safely.");

            const string cancelSql = """
                UPDATE dbo.Purchases SET IsDeleted=1, Status='Cancelled', CancelledByUserId=@UserId,
                    CancelledAtUtc=SYSUTCDATETIME(), UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME()
                WHERE Id=@Id AND IsDeleted=0;
                UPDATE dbo.PurchaseItems SET IsDeleted=1 WHERE PurchaseId=@Id AND IsDeleted=0;
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

    private static async Task EnsureSupplierAsync(SqlConnection connection, SqlTransaction transaction, long supplierId, CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand("SELECT COUNT(1) FROM dbo.Suppliers WITH (UPDLOCK, ROWLOCK) WHERE Id=@Id AND IsDeleted=0 AND IsActive=1;", connection, transaction);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = supplierId;
        if (Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken)) == 0)
            throw new KeyNotFoundException("Active supplier not found.");
    }

    private static async Task<PurchaseLineSnapshot> ReadMedicineAsync(SqlConnection connection, SqlTransaction transaction, PurchaseLineRequest line, CancellationToken cancellationToken)
    {
        const string sql = "SELECT Name, BatchNumber, ExpiryDate, GstRate, Stock FROM dbo.Medicines WITH (UPDLOCK, ROWLOCK) WHERE Id=@Id AND IsDeleted=0;";
        await using var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.Add("@Id", SqlDbType.BigInt).Value = line.MedicineId;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) throw new KeyNotFoundException($"Medicine {line.MedicineId} not found.");
        var taxable = line.Rate * line.Quantity - line.DiscountAmount;
        var tax = Math.Round(taxable * reader.GetDecimal(3) / 100m, 2, MidpointRounding.AwayFromZero);
        return new PurchaseLineSnapshot(line.MedicineId, reader.GetString(0), reader.GetString(1), DateOnly.FromDateTime(reader.GetDateTime(2)),
            line.Quantity, line.Rate, reader.GetDecimal(3), line.DiscountAmount, tax, taxable + tax, reader.GetInt32(4));
    }

    private static async Task ReceiveLineAsync(SqlConnection connection, SqlTransaction transaction, long purchaseId, string purchaseNumber, PurchaseLineSnapshot line, long userId, CancellationToken cancellationToken)
    {
        const string itemSql = """
            INSERT INTO dbo.PurchaseItems
                (PurchaseId, MedicineId, MedicineName, BatchNumber, ExpiryDate, Quantity, Rate, GstRate, DiscountAmount, TaxAmount, LineTotal)
            VALUES (@PurchaseId, @MedicineId, @Name, @Batch, @Expiry, @Quantity, @Rate, @Gst, @Discount, @Tax, @Total);
            """;
        await using (var command = new SqlCommand(itemSql, connection, transaction))
        {
            command.Parameters.Add("@PurchaseId", SqlDbType.BigInt).Value = purchaseId;
            command.Parameters.Add("@MedicineId", SqlDbType.BigInt).Value = line.MedicineId;
            command.Parameters.Add("@Name", SqlDbType.NVarChar, 160).Value = line.Name;
            command.Parameters.Add("@Batch", SqlDbType.NVarChar, 80).Value = line.Batch;
            command.Parameters.Add("@Expiry", SqlDbType.Date).Value = line.Expiry.ToDateTime(TimeOnly.MinValue);
            command.Parameters.Add("@Quantity", SqlDbType.Int).Value = line.Quantity;
            AddMoney(command, "@Rate", line.Rate);
            AddMoney(command, "@Gst", line.GstRate, 5);
            AddMoney(command, "@Discount", line.DiscountAmount);
            AddMoney(command, "@Tax", line.TaxAmount);
            AddMoney(command, "@Total", line.LineTotal);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        var newStock = checked(line.PreviousStock + line.Quantity);
        await using (var command = new SqlCommand("UPDATE dbo.Medicines SET Stock=@Stock, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME() WHERE Id=@MedicineId AND IsDeleted=0;", connection, transaction))
        {
            command.Parameters.Add("@Stock", SqlDbType.Int).Value = newStock;
            command.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
            command.Parameters.Add("@MedicineId", SqlDbType.BigInt).Value = line.MedicineId;
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        await InsertMovementAsync(connection, transaction, line.MedicineId, "Purchase receipt", line.Quantity, line.PreviousStock,
            newStock, "Stock received against purchase invoice.", purchaseNumber, userId, cancellationToken);
    }

    private static async Task ReverseLineAsync(SqlConnection connection, SqlTransaction transaction, long medicineId, int quantity, string reference, long userId, CancellationToken cancellationToken)
    {
        await using var stockCommand = new SqlCommand("SELECT Stock FROM dbo.Medicines WITH (UPDLOCK, ROWLOCK) WHERE Id=@Id AND IsDeleted=0;", connection, transaction);
        stockCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = medicineId;
        var value = await stockCommand.ExecuteScalarAsync(cancellationToken);
        if (value is null) throw new InvalidOperationException("A purchased medicine is no longer available.");
        var previous = Convert.ToInt32(value);
        if (previous < quantity) throw new InvalidOperationException("Purchase cannot be cancelled because some received stock has already been consumed.");
        var next = previous - quantity;
        await using (var updateCommand = new SqlCommand("UPDATE dbo.Medicines SET Stock=@Stock, UpdatedByUserId=@UserId, UpdatedAtUtc=SYSUTCDATETIME() WHERE Id=@Id;", connection, transaction))
        {
            updateCommand.Parameters.Add("@Stock", SqlDbType.Int).Value = next;
            updateCommand.Parameters.Add("@UserId", SqlDbType.BigInt).Value = userId;
            updateCommand.Parameters.Add("@Id", SqlDbType.BigInt).Value = medicineId;
            await updateCommand.ExecuteNonQueryAsync(cancellationToken);
        }
        await InsertMovementAsync(connection, transaction, medicineId, "Purchase cancellation", -quantity, previous, next,
            "Stock reversed for cancelled purchase.", reference, userId, cancellationToken);
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

    private static void AddQueryParameters(SqlCommand command, PurchaseQuery query)
    {
        command.Parameters.Add("@PaymentStatus", SqlDbType.NVarChar, 20).Value = (object?)query.PaymentStatus ?? DBNull.Value;
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

    private static PurchaseSummaryDto ReadSummary(SqlDataReader reader)
    {
        var id = reader.GetInt64(0);
        var date = DateOnly.FromDateTime(reader.GetDateTime(4));
        return new PurchaseSummaryDto(id, PurchaseNumber(id, date), reader.GetInt64(1), reader.GetString(2), reader.GetString(3),
            date, reader.GetInt32(5), reader.GetDecimal(6), reader.GetDecimal(7), reader.GetDecimal(8), reader.GetDecimal(9),
            reader.GetDecimal(10), reader.GetDecimal(11), reader.GetString(12), reader.GetString(13), reader.GetString(14),
            DateTime.SpecifyKind(reader.GetDateTime(15), DateTimeKind.Utc));
    }

    private static string PurchaseNumber(long id, DateOnly date) => $"PUR-{date.Year}-{id:000000}";

    private sealed record PurchaseLineSnapshot(long MedicineId, string Name, string Batch, DateOnly Expiry, int Quantity,
        decimal Rate, decimal GstRate, decimal DiscountAmount, decimal TaxAmount, decimal LineTotal, int PreviousStock);
}
