using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Operations;

namespace MediDesk.Business.Interfaces;

public interface IPurchaseService
{
    Task<PagedResponse<PurchaseSummaryDto>> GetPageAsync(PurchaseQuery query, CancellationToken cancellationToken);
    Task<PurchaseDto?> GetByIdAsync(long id, CancellationToken cancellationToken);
    Task<PurchaseDto> CreateAsync(CreatePurchaseRequest request, long userId, CancellationToken cancellationToken);
    Task<bool> CancelAsync(long id, long userId, CancellationToken cancellationToken);
}
