using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Masters;

namespace MediDesk.Business.Services;

public sealed class MedicineMasterService(IMedicineMasterRepository repository) : IMedicineMasterService
{
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    { "Category", "Manufacturer", "Generic" };

    public Task<PagedResponse<MedicineMasterDto>> GetPageAsync(MedicineMasterQuery query, CancellationToken cancellationToken)
    {
        var type = string.IsNullOrWhiteSpace(query.Type) ? null : NormalizeType(query.Type);
        return repository.GetPageAsync(query with
        {
            Type = type, Search = query.Search?.Trim(), Page = Math.Max(1, query.Page), PageSize = Math.Clamp(query.PageSize, 1, 200)
        }, cancellationToken);
    }

    public Task<MedicineMasterDto?> GetByIdAsync(long id, CancellationToken cancellationToken) => repository.GetByIdAsync(id, cancellationToken);

    public Task<MedicineMasterDto> CreateAsync(CreateMedicineMasterRequest request, long userId, CancellationToken cancellationToken) =>
        repository.CreateAsync(request with
        {
            Type = NormalizeType(request.Type), Name = request.Name.Trim(), Description = request.Description?.Trim()
        }, userId, cancellationToken);

    public async Task<MedicineMasterWriteResult> UpdateAsync(long id, UpdateMedicineMasterRequest request, long userId, CancellationToken cancellationToken)
    {
        ValidateRowVersion(request.RowVersion);
        var current = await repository.GetByIdAsync(id, cancellationToken);
        if (current is null) return new MedicineMasterWriteResult(false, NotFound: true);
        if (current.UsageCount > 0 && !current.Name.Equals(request.Name.Trim(), StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("A master used by medicines cannot be renamed.");
        return await repository.UpdateAsync(id, request with { Name = request.Name.Trim(), Description = request.Description?.Trim() }, userId, cancellationToken);
    }

    public async Task<bool> DeleteAsync(long id, long userId, CancellationToken cancellationToken)
    {
        var master = await repository.GetByIdAsync(id, cancellationToken);
        if (master is null) return false;
        if (master.UsageCount > 0) throw new InvalidOperationException("This master is used by medicines and cannot be deleted.");
        return await repository.SoftDeleteAsync(id, userId, cancellationToken);
    }

    private static string NormalizeType(string type) => AllowedTypes.SingleOrDefault(value => value.Equals(type.Trim(), StringComparison.OrdinalIgnoreCase))
        ?? throw new ArgumentException("Master type must be Category, Manufacturer or Generic.");

    private static void ValidateRowVersion(string value)
    {
        try { if (Convert.FromBase64String(value).Length == 8) return; }
        catch (FormatException) { }
        throw new ArgumentException("The master version is invalid.");
    }
}
