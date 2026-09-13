using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Operations;

namespace MediDesk.Business.Services;

public sealed class PurchaseService(IPurchaseRepository repository) : IPurchaseService
{
    private static readonly HashSet<string> PaymentMethods = new(StringComparer.OrdinalIgnoreCase) { "Cash", "Bank", "UPI", "Credit" };
    private static readonly HashSet<string> PaymentStatuses = new(StringComparer.OrdinalIgnoreCase) { "Paid", "Part paid", "Credit" };

    public Task<PagedResponse<PurchaseSummaryDto>> GetPageAsync(PurchaseQuery query, CancellationToken cancellationToken)
    {
        var paymentStatus = string.IsNullOrWhiteSpace(query.PaymentStatus) ? null
            : PaymentStatuses.SingleOrDefault(value => value.Equals(query.PaymentStatus.Trim(), StringComparison.OrdinalIgnoreCase))
                ?? throw new ArgumentException("Payment status must be Paid, Part paid or Credit.");
        return repository.GetPageAsync(query with
        {
            Search = query.Search?.Trim(), PaymentStatus = paymentStatus,
            Page = Math.Max(1, query.Page), PageSize = Math.Clamp(query.PageSize, 1, 200)
        }, cancellationToken);
    }

    public Task<PurchaseDto?> GetByIdAsync(long id, CancellationToken cancellationToken) => repository.GetByIdAsync(id, cancellationToken);

    public Task<PurchaseDto> CreateAsync(CreatePurchaseRequest request, long userId, CancellationToken cancellationToken)
    {
        if (request.InvoiceDate > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new ArgumentException("Purchase invoice date cannot be in the future.");
        if (request.Items.Count == 0) throw new ArgumentException("Add at least one medicine to the purchase.");
        if (request.Items.Select(item => item.MedicineId).Distinct().Count() != request.Items.Count)
            throw new ArgumentException("The same medicine batch cannot be added more than once.");
        foreach (var item in request.Items)
            if (item.DiscountAmount > item.Rate * item.Quantity)
                throw new ArgumentException("Line discount cannot exceed the line amount.");
        var paymentMethod = PaymentMethods.SingleOrDefault(value => value.Equals(request.PaymentMethod.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? throw new ArgumentException("Payment method must be Cash, Bank, UPI or Credit.");
        if (paymentMethod == "Credit" && request.AmountPaid > 0)
            throw new ArgumentException("Amount paid must be zero for a credit purchase.");
        return repository.CreateAsync(request with
        {
            SupplierInvoiceNumber = request.SupplierInvoiceNumber.Trim().ToUpperInvariant(), PaymentMethod = paymentMethod,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        }, userId, cancellationToken);
    }

    public Task<bool> CancelAsync(long id, long userId, CancellationToken cancellationToken) => repository.CancelAsync(id, userId, cancellationToken);
}
