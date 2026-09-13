using System.ComponentModel.DataAnnotations;

namespace MediDesk.Common.Contracts.Operations;

public sealed record PurchaseLineRequest(
    [Range(1, long.MaxValue)] long MedicineId,
    [Range(1, int.MaxValue)] int Quantity,
    [Range(0, 99999999)] decimal Rate,
    [Range(0, 99999999)] decimal DiscountAmount);

public sealed record CreatePurchaseRequest(
    [Range(1, long.MaxValue)] long SupplierId,
    [Required, StringLength(80)] string SupplierInvoiceNumber,
    DateOnly InvoiceDate,
    [Required, StringLength(20)] string PaymentMethod,
    [Range(0, 999999999999)] decimal AmountPaid,
    [StringLength(500)] string? Notes,
    [Required, MinLength(1)] IReadOnlyCollection<PurchaseLineRequest> Items);

public sealed record PurchaseLineDto(
    long Id,
    long MedicineId,
    string MedicineName,
    string BatchNumber,
    DateOnly ExpiryDate,
    int Quantity,
    decimal Rate,
    decimal GstRate,
    decimal DiscountAmount,
    decimal TaxAmount,
    decimal LineTotal);

public sealed record PurchaseSummaryDto(
    long Id,
    string PurchaseNumber,
    long SupplierId,
    string SupplierName,
    string SupplierInvoiceNumber,
    DateOnly InvoiceDate,
    int ItemCount,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal TaxTotal,
    decimal GrandTotal,
    decimal AmountPaid,
    decimal AmountDue,
    string PaymentMethod,
    string PaymentStatus,
    string Status,
    DateTime CreatedAtUtc);

public sealed record PurchaseDto(
    long Id,
    string PurchaseNumber,
    long SupplierId,
    string SupplierName,
    string SupplierInvoiceNumber,
    DateOnly InvoiceDate,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal TaxTotal,
    decimal GrandTotal,
    decimal AmountPaid,
    decimal AmountDue,
    string PaymentMethod,
    string PaymentStatus,
    string Status,
    string Notes,
    DateTime CreatedAtUtc,
    IReadOnlyCollection<PurchaseLineDto> Items);

public sealed record PurchaseQuery(string? Search = null, string? PaymentStatus = null, int Page = 1, int PageSize = 100);
