using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Operations;

namespace MediDesk.Business.Services;

public sealed class SaleService(ISaleRepository repository) : ISaleService
{
    private static readonly HashSet<string> PaymentMethods = new(StringComparer.OrdinalIgnoreCase) { "Cash", "UPI", "Card", "Credit" };

    public Task<PagedResponse<SaleSummaryDto>> GetPageAsync(SaleQuery query, CancellationToken cancellationToken)
    {
        var paymentMethod = string.IsNullOrWhiteSpace(query.PaymentMethod) ? null
            : PaymentMethods.SingleOrDefault(value => value.Equals(query.PaymentMethod.Trim(), StringComparison.OrdinalIgnoreCase))
                ?? throw new ArgumentException("Payment method must be Cash, UPI, Card or Credit.");
        return repository.GetPageAsync(query with
        {
            Search = query.Search?.Trim(), PaymentMethod = paymentMethod,
            Page = Math.Max(1, query.Page), PageSize = Math.Clamp(query.PageSize, 1, 200)
        }, cancellationToken);
    }

    public Task<SaleDto?> GetByIdAsync(long id, CancellationToken cancellationToken) => repository.GetByIdAsync(id, cancellationToken);

    public Task<SaleDto> CreateAsync(CreateSaleRequest request, long userId, CancellationToken cancellationToken)
    {
        if (request.Items.Count == 0) throw new ArgumentException("Add at least one medicine to the bill.");
        if (request.Items.Select(item => item.MedicineId).Distinct().Count() != request.Items.Count)
            throw new ArgumentException("The same medicine batch cannot be added more than once.");
        var paymentMethod = PaymentMethods.SingleOrDefault(value => value.Equals(request.PaymentMethod.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? throw new ArgumentException("Payment method must be Cash, UPI, Card or Credit.");
        var customerName = NormalizeOptional(request.CustomerName);
        var customerPhone = NormalizeOptional(request.CustomerPhone);
        if (paymentMethod == "Credit" && (customerName is null || customerPhone is null))
            throw new ArgumentException("Customer name and phone are required for a credit sale.");
        if (paymentMethod == "Credit" && request.AmountReceived > 0)
            throw new ArgumentException("Amount received must be zero for a credit sale.");
        return repository.CreateAsync(request with
        {
            CustomerName = customerName, CustomerPhone = customerPhone, PaymentMethod = paymentMethod,
            Notes = NormalizeOptional(request.Notes)
        }, userId, cancellationToken);
    }

    public Task<bool> CancelAsync(long id, long userId, CancellationToken cancellationToken) => repository.CancelAsync(id, userId, cancellationToken);

    private static string? NormalizeOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
