using System.ComponentModel.DataAnnotations;

namespace MediDesk.Common.Contracts.Operations;

public sealed record SaleLineRequest(
    [Range(1, long.MaxValue)] long MedicineId,
    [Range(1, int.MaxValue)] int Quantity,
    [Range(0, 99999999)] decimal DiscountAmount);

public sealed record CreateSaleRequest(
    [StringLength(160)] string? CustomerName,
    [StringLength(18), RegularExpression("^[+0-9 ()-]{10,18}$")] string? CustomerPhone,
    [Required, StringLength(20)] string PaymentMethod,
    [Range(0, 999999999999)] decimal AmountReceived,
    [StringLength(500)] string? Notes,
    [Required, MinLength(1)] IReadOnlyCollection<SaleLineRequest> Items);

public sealed record SaleLineDto(
    long Id,
    long MedicineId,
    string MedicineName,
    string GenericName,
    string BatchNumber,
    DateOnly ExpiryDate,
    int Quantity,
    decimal UnitPrice,
    decimal GstRate,
    decimal DiscountAmount,
    decimal TaxableAmount,
    decimal TaxAmount,
    decimal LineTotal);

public sealed record SaleSummaryDto(
    long Id,
    string InvoiceNumber,
    string CustomerName,
    string CustomerPhone,
    int ItemCount,
    decimal GrossAmount,
    decimal DiscountTotal,
    decimal TaxableAmount,
    decimal TaxTotal,
    decimal GrandTotal,
    decimal AmountReceived,
    decimal AmountDue,
    decimal ChangeAmount,
    string PaymentMethod,
    string PaymentStatus,
    string Status,
    DateTime CreatedAtUtc);

public sealed record SaleDto(
    long Id,
    string InvoiceNumber,
    string CustomerName,
    string CustomerPhone,
    decimal GrossAmount,
    decimal DiscountTotal,
    decimal TaxableAmount,
    decimal TaxTotal,
    decimal GrandTotal,
    decimal AmountReceived,
    decimal AmountDue,
    decimal ChangeAmount,
    string PaymentMethod,
    string PaymentStatus,
    string Status,
    string Notes,
    DateTime CreatedAtUtc,
    IReadOnlyCollection<SaleLineDto> Items);

public sealed record SaleQuery(string? Search = null, string? PaymentMethod = null, int Page = 1, int PageSize = 100);
