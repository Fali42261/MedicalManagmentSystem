using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Partners;

namespace MediDesk.Business.Services;

public sealed class SupplierService(ISupplierRepository repository) : ISupplierService
{
    public Task<PagedResponse<SupplierDto>> GetPageAsync(SupplierQuery query, CancellationToken cancellationToken)
    {
        var status = query.Status?.Trim();
        if (!string.IsNullOrWhiteSpace(status))
            status = status.Equals("Active", StringComparison.OrdinalIgnoreCase) ? "Active"
                : status.Equals("Inactive", StringComparison.OrdinalIgnoreCase) ? "Inactive"
                : throw new ArgumentException("Supplier status must be Active or Inactive.");
        return repository.GetPageAsync(query with
        {
            Search = query.Search?.Trim(), Status = status, Page = Math.Max(1, query.Page), PageSize = Math.Clamp(query.PageSize, 1, 200)
        }, cancellationToken);
    }

    public Task<SupplierDto?> GetByIdAsync(long id, CancellationToken cancellationToken) => repository.GetByIdAsync(id, cancellationToken);

    public Task<SupplierDto> CreateAsync(CreateSupplierRequest request, long userId, CancellationToken cancellationToken) =>
        repository.CreateAsync(Normalize(request), userId, cancellationToken);

    public async Task<SupplierWriteResult> UpdateAsync(long id, UpdateSupplierRequest request, long userId, CancellationToken cancellationToken)
    {
        ValidateRowVersion(request.RowVersion);
        return await repository.UpdateAsync(id, Normalize(request), userId, cancellationToken);
    }

    public Task<bool> DeleteAsync(long id, long userId, CancellationToken cancellationToken) =>
        repository.SoftDeleteAsync(id, userId, cancellationToken);

    private static CreateSupplierRequest Normalize(CreateSupplierRequest request) => request with
    {
        BusinessName = request.BusinessName.Trim(), ContactPerson = request.ContactPerson.Trim(), Phone = request.Phone.Trim(),
        Email = NormalizeOptional(request.Email)?.ToLowerInvariant(), Gstin = NormalizeOptional(request.Gstin)?.ToUpperInvariant(),
        DrugLicenseNumber = NormalizeOptional(request.DrugLicenseNumber)?.ToUpperInvariant(), Address = NormalizeOptional(request.Address),
        City = request.City.Trim(), State = request.State.Trim(), PostalCode = NormalizeOptional(request.PostalCode)
    };

    private static UpdateSupplierRequest Normalize(UpdateSupplierRequest request) => request with
    {
        BusinessName = request.BusinessName.Trim(), ContactPerson = request.ContactPerson.Trim(), Phone = request.Phone.Trim(),
        Email = NormalizeOptional(request.Email)?.ToLowerInvariant(), Gstin = NormalizeOptional(request.Gstin)?.ToUpperInvariant(),
        DrugLicenseNumber = NormalizeOptional(request.DrugLicenseNumber)?.ToUpperInvariant(), Address = NormalizeOptional(request.Address),
        City = request.City.Trim(), State = request.State.Trim(), PostalCode = NormalizeOptional(request.PostalCode)
    };

    private static string? NormalizeOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static void ValidateRowVersion(string value)
    {
        try { if (Convert.FromBase64String(value).Length == 8) return; }
        catch (FormatException) { }
        throw new ArgumentException("The supplier version is invalid.");
    }
}
