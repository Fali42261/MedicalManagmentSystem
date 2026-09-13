using System.ComponentModel.DataAnnotations;

namespace MediDesk.Common.Contracts.Masters;

public sealed record MedicineMasterDto(
    long Id, string Code, string Type, string Name, string Description,
    int UsageCount, bool IsActive, DateTime UpdatedAtUtc, string RowVersion);

public sealed record CreateMedicineMasterRequest(
    [Required] string Type,
    [Required, StringLength(160, MinimumLength = 2)] string Name,
    [StringLength(300)] string? Description);

public sealed record UpdateMedicineMasterRequest(
    [Required, StringLength(160, MinimumLength = 2)] string Name,
    [StringLength(300)] string? Description,
    bool IsActive,
    [Required] string RowVersion);

public sealed record MedicineMasterQuery(string? Type = null, string? Search = null, int Page = 1, int PageSize = 100);

public sealed record MedicineMasterWriteResult(bool Success, bool NotFound = false, bool Conflict = false);
