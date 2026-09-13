using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Partners;

namespace MediDesk.Business.Interfaces;

public interface ISupplierService
{
    Task<PagedResponse<SupplierDto>> GetPageAsync(SupplierQuery query, CancellationToken cancellationToken);
    Task<SupplierDto?> GetByIdAsync(long id, CancellationToken cancellationToken);
    Task<SupplierDto> CreateAsync(CreateSupplierRequest request, long userId, CancellationToken cancellationToken);
    Task<SupplierWriteResult> UpdateAsync(long id, UpdateSupplierRequest request, long userId, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(long id, long userId, CancellationToken cancellationToken);
}
