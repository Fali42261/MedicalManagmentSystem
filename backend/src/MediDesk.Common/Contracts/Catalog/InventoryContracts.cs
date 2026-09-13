using System.ComponentModel.DataAnnotations;

namespace MediDesk.Common.Contracts.Catalog;

public sealed record StockAdjustmentRequest(
    [Range(1, long.MaxValue)] long MedicineId,
    [Required] string AdjustmentType,
    [Range(1, int.MaxValue)] int Quantity,
    [Required, StringLength(300, MinimumLength = 3)] string Reason,
    [StringLength(80)] string? ReferenceNumber);

public sealed record StockMovementDto(
    long Id,
    long MedicineId,
    string MedicineName,
    string Batch,
    string MovementType,
    int QuantityChange,
    int PreviousStock,
    int NewStock,
    string Reason,
    string? ReferenceNumber,
    string CreatedBy,
    DateTime CreatedAtUtc);

public sealed record StockAdjustmentResponse(MedicineDto Medicine, StockMovementDto Movement);
