using MediDesk.Common.Contracts.Catalog;

namespace MediDesk.Business.Interfaces;

public interface IMedicineService
{
    Task<PagedResponse<MedicineDto>> GetPageAsync(MedicineQuery query, CancellationToken cancellationToken);
    Task<MedicineDto?> GetByIdAsync(long id, CancellationToken cancellationToken);
    Task<MedicineDto> CreateAsync(CreateMedicineRequest request, long userId, CancellationToken cancellationToken);
    Task<MedicineWriteResult> UpdateAsync(long id, UpdateMedicineRequest request, long userId, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(long id, long userId, CancellationToken cancellationToken);
}
