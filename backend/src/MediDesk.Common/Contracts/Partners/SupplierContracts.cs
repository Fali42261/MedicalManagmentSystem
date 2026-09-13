using System.ComponentModel.DataAnnotations;

namespace MediDesk.Common.Contracts.Partners;

public sealed record SupplierDto(
    long Id,
    string Code,
    string BusinessName,
    string ContactPerson,
    string Phone,
    string Email,
    string Gstin,
    string DrugLicenseNumber,
    string Address,
    string City,
    string State,
    string PostalCode,
    decimal OutstandingBalance,
    bool IsActive,
    DateTime UpdatedAtUtc,
    string RowVersion);

public sealed record CreateSupplierRequest(
    [Required, StringLength(160, MinimumLength = 2)] string BusinessName,
    [Required, StringLength(120, MinimumLength = 2)] string ContactPerson,
    [Required, StringLength(18, MinimumLength = 10), RegularExpression("^[+0-9 ()-]{10,18}$")] string Phone,
    [EmailAddress, StringLength(256)] string? Email,
    [StringLength(15, MinimumLength = 15), RegularExpression("^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z]Z[0-9A-Za-z]$")] string? Gstin,
    [StringLength(80)] string? DrugLicenseNumber,
    [StringLength(300)] string? Address,
    [Required, StringLength(100, MinimumLength = 2)] string City,
    [Required, StringLength(100, MinimumLength = 2)] string State,
    [RegularExpression("^[0-9]{6}$")] string? PostalCode,
    [Range(0, 999999999999)] decimal OpeningBalance);

public sealed record UpdateSupplierRequest(
    [Required, StringLength(160, MinimumLength = 2)] string BusinessName,
    [Required, StringLength(120, MinimumLength = 2)] string ContactPerson,
    [Required, StringLength(18, MinimumLength = 10), RegularExpression("^[+0-9 ()-]{10,18}$")] string Phone,
    [EmailAddress, StringLength(256)] string? Email,
    [StringLength(15, MinimumLength = 15), RegularExpression("^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z]Z[0-9A-Za-z]$")] string? Gstin,
    [StringLength(80)] string? DrugLicenseNumber,
    [StringLength(300)] string? Address,
    [Required, StringLength(100, MinimumLength = 2)] string City,
    [Required, StringLength(100, MinimumLength = 2)] string State,
    [RegularExpression("^[0-9]{6}$")] string? PostalCode,
    bool IsActive,
    [Required] string RowVersion);

public sealed record SupplierQuery(string? Search = null, string? Status = null, int Page = 1, int PageSize = 100);

public sealed record SupplierWriteResult(bool Success, bool NotFound = false, bool Conflict = false);
