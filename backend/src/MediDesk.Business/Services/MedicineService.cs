using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;

namespace MediDesk.Business.Services;

public sealed class MedicineService(IMedicineRepository repository) : IMedicineService
{
    public Task<PagedResponse<MedicineDto>> GetPageAsync(MedicineQuery query, CancellationToken cancellationToken)
    {
        var normalized = query with
        {
            Page = Math.Max(1, query.Page),
            PageSize = Math.Clamp(query.PageSize, 1, 200),
            Search = query.Search?.Trim(),
            Status = query.Status?.Trim()
        };
        return repository.GetPageAsync(normalized, cancellationToken);
    }

    public Task<MedicineDto?> GetByIdAsync(long id, CancellationToken cancellationToken) =>
        repository.GetByIdAsync(id, cancellationToken);

    public Task<MedicineDto> CreateAsync(CreateMedicineRequest request, long userId, CancellationToken cancellationToken)
    {
        ValidatePrices(request.Purchase, request.Sale);
        ValidateExpiry(request.ExpiryDate);
        return repository.CreateAsync(Normalize(request), userId, cancellationToken);
    }

    public Task<MedicineWriteResult> UpdateAsync(long id, UpdateMedicineRequest request, long userId, CancellationToken cancellationToken)
    {
        ValidatePrices(request.Purchase, request.Sale);
        ValidateExpiry(request.ExpiryDate);
        if (!TryDecodeRowVersion(request.RowVersion))
            throw new ArgumentException("The medicine version is invalid.");
        return repository.UpdateAsync(id, Normalize(request), userId, cancellationToken);
    }

    public Task<bool> DeleteAsync(long id, long userId, CancellationToken cancellationToken) =>
        repository.SoftDeleteAsync(id, userId, cancellationToken);

    private static void ValidatePrices(decimal purchase, decimal sale)
    {
        if (sale < purchase) throw new ArgumentException("Sale price cannot be lower than purchase price.");
    }

    private static void ValidateExpiry(DateOnly expiryDate)
    {
        if (expiryDate < DateOnly.FromDateTime(DateTime.UtcNow))
            throw new ArgumentException("Expiry date cannot be in the past.");
    }

    private static bool TryDecodeRowVersion(string value)
    {
        try { return Convert.FromBase64String(value).Length == 8; }
        catch (FormatException) { return false; }
    }

    private static CreateMedicineRequest Normalize(CreateMedicineRequest request) => request with
    {
        Name = request.Name.Trim(), Generic = request.Generic.Trim(), Category = request.Category.Trim(),
        Manufacturer = request.Manufacturer?.Trim() ?? string.Empty, DosageForm = request.DosageForm?.Trim() ?? string.Empty, Strength = request.Strength?.Trim() ?? string.Empty,
        Batch = request.Batch.Trim().ToUpperInvariant(), Rack = request.Rack?.Trim().ToUpperInvariant() ?? string.Empty
    };

    private static UpdateMedicineRequest Normalize(UpdateMedicineRequest request) => request with
    {
        Name = request.Name.Trim(), Generic = request.Generic.Trim(), Category = request.Category.Trim(),
        Manufacturer = request.Manufacturer?.Trim() ?? string.Empty, DosageForm = request.DosageForm?.Trim() ?? string.Empty, Strength = request.Strength?.Trim() ?? string.Empty,
        Batch = request.Batch.Trim().ToUpperInvariant(), Rack = request.Rack?.Trim().ToUpperInvariant() ?? string.Empty
    };
}
