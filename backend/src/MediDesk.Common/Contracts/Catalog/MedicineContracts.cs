using System.ComponentModel.DataAnnotations;

namespace MediDesk.Common.Contracts.Catalog;

public sealed record MedicineDto(
    long Id,
    string Name,
    string Generic,
    string Category,
    string Manufacturer,
    string DosageForm,
    string Strength,
    string Batch,
    DateOnly ExpiryDate,
    decimal Purchase,
    decimal Sale,
    int Stock,
    int MinStock,
    decimal Gst,
    string Rack,
    string Status,
    string RowVersion);

public sealed record CreateMedicineRequest(
    [Required, StringLength(160, MinimumLength = 2)] string Name,
    [Required, StringLength(160, MinimumLength = 2)] string Generic,
    [Required, StringLength(80)] string Category,
    [StringLength(160)] string? Manufacturer,
    [StringLength(40)] string? DosageForm,
    [StringLength(40)] string? Strength,
    [Required, StringLength(80)] string Batch,
    DateOnly ExpiryDate,
    [Range(0, 99999999)] decimal Purchase,
    [Range(0, 99999999)] decimal Sale,
    [Range(0, int.MaxValue)] int Stock,
    [Range(0, int.MaxValue)] int MinStock,
    [Range(0, 100)] decimal Gst,
    [StringLength(40)] string? Rack);

public sealed record UpdateMedicineRequest(
    [Required, StringLength(160, MinimumLength = 2)] string Name,
    [Required, StringLength(160, MinimumLength = 2)] string Generic,
    [Required, StringLength(80)] string Category,
    [StringLength(160)] string? Manufacturer,
    [StringLength(40)] string? DosageForm,
    [StringLength(40)] string? Strength,
    [Required, StringLength(80)] string Batch,
    DateOnly ExpiryDate,
    [Range(0, 99999999)] decimal Purchase,
    [Range(0, 99999999)] decimal Sale,
    [Range(0, int.MaxValue)] int Stock,
    [Range(0, int.MaxValue)] int MinStock,
    [Range(0, 100)] decimal Gst,
    [StringLength(40)] string? Rack,
    [Required] string RowVersion);

public sealed record MedicineQuery(string? Search = null, string? Status = null, int Page = 1, int PageSize = 50, string SortBy = "name", string SortDirection = "asc");

public sealed record PagedResponse<T>(IReadOnlyCollection<T> Items, int Page, int PageSize, int TotalCount);

public sealed record MedicineWriteResult(bool Success, bool NotFound = false, bool Conflict = false);
