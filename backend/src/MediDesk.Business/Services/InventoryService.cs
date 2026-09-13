using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;

namespace MediDesk.Business.Services;

public sealed class InventoryService(IInventoryRepository repository, IMedicineRepository medicineRepository) : IInventoryService
{
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "Add stock", "Remove stock", "Opening correction"
    };

    public Task<IReadOnlyCollection<StockMovementDto>> GetRecentMovementsAsync(int take, CancellationToken cancellationToken) =>
        repository.GetRecentMovementsAsync(Math.Clamp(take, 1, 100), cancellationToken);

    public async Task<StockAdjustmentResponse> AdjustAsync(StockAdjustmentRequest request, long userId, CancellationToken cancellationToken)
    {
        if (!AllowedTypes.Contains(request.AdjustmentType)) throw new ArgumentException("Invalid stock adjustment type.");
        var normalized = request with
        {
            AdjustmentType = AllowedTypes.Single(type => type.Equals(request.AdjustmentType, StringComparison.OrdinalIgnoreCase)),
            Reason = request.Reason.Trim(),
            ReferenceNumber = string.IsNullOrWhiteSpace(request.ReferenceNumber) ? null : request.ReferenceNumber.Trim()
        };
        var movement = await repository.AdjustAsync(normalized, userId, cancellationToken);
        var medicine = await medicineRepository.GetByIdAsync(request.MedicineId, cancellationToken)
                       ?? throw new InvalidOperationException("Medicine was not found after stock adjustment.");
        return new StockAdjustmentResponse(medicine, movement);
    }
}
