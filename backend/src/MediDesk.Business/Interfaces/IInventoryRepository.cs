using MediDesk.Common.Contracts.Catalog;

namespace MediDesk.Business.Interfaces;

public interface IInventoryRepository
{
    Task<IReadOnlyCollection<StockMovementDto>> GetRecentMovementsAsync(int take, CancellationToken cancellationToken);
    Task<StockMovementDto> AdjustAsync(StockAdjustmentRequest request, long userId, CancellationToken cancellationToken);
}
