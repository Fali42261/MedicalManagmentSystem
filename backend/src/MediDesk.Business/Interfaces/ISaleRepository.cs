using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Operations;

namespace MediDesk.Business.Interfaces;

public interface ISaleRepository
{
    Task<PagedResponse<SaleSummaryDto>> GetPageAsync(SaleQuery query, CancellationToken cancellationToken);
    Task<SaleDto?> GetByIdAsync(long id, CancellationToken cancellationToken);
    Task<SaleDto> CreateAsync(CreateSaleRequest request, long userId, CancellationToken cancellationToken);
    Task<bool> CancelAsync(long id, long userId, CancellationToken cancellationToken);
}
