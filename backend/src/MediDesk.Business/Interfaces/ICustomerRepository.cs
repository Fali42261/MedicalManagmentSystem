using MediDesk.Common.Contracts.Catalog; using MediDesk.Common.Contracts.Partners;
namespace MediDesk.Business.Interfaces;
public interface ICustomerRepository { Task<PagedResponse<CustomerDto>> GetPageAsync(CustomerQuery q,CancellationToken ct); Task<CustomerDto?> GetByIdAsync(long id,CancellationToken ct); Task<CustomerDto> CreateAsync(CreateCustomerRequest r,long uid,CancellationToken ct); Task<CustomerWriteResult> UpdateAsync(long id,UpdateCustomerRequest r,long uid,CancellationToken ct); Task<bool> SoftDeleteAsync(long id,long uid,CancellationToken ct); }

