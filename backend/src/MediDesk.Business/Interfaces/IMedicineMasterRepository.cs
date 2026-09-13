using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Masters;

namespace MediDesk.Business.Interfaces;

public interface IMedicineMasterRepository
{
    Task<PagedResponse<MedicineMasterDto>> GetPageAsync(MedicineMasterQuery query, CancellationToken cancellationToken);
    Task<MedicineMasterDto?> GetByIdAsync(long id, CancellationToken cancellationToken);
    Task<MedicineMasterDto> CreateAsync(CreateMedicineMasterRequest request, long userId, CancellationToken cancellationToken);
    Task<MedicineMasterWriteResult> UpdateAsync(long id, UpdateMedicineMasterRequest request, long userId, CancellationToken cancellationToken);
    Task<bool> SoftDeleteAsync(long id, long userId, CancellationToken cancellationToken);
}
