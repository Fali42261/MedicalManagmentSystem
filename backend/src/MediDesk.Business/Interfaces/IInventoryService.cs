using MediDesk.Common.Contracts.Catalog;

namespace MediDesk.Business.Interfaces;

public interface IInventoryService
{
    Task<IReadOnlyCollection<StockMovementDto>> GetRecentMovementsAsync(int take, CancellationToken cancellationToken);
    Task<StockAdjustmentResponse> AdjustAsync(StockAdjustmentRequest request, long userId, CancellationToken cancellationToken);
}
