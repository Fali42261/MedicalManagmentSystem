using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Auth;

namespace MediDesk.Business.Services;

public sealed class NavigationService(IAuthRepository repository) : INavigationService
{
    public async Task<IReadOnlyCollection<MenuItemDto>> GetForUserAsync(long userId, CancellationToken cancellationToken)
    {
        var rows = await repository.GetNavigationAsync(userId, cancellationToken);
        return rows
            .GroupBy(row => new { row.Key, row.Label, row.Icon, row.GroupName, row.SortOrder })
            .OrderBy(group => group.Key.SortOrder)
            .Select(group => new MenuItemDto(
                group.Key.Key,
                group.Key.Label,
                group.Key.Icon,
                group.Key.GroupName,
                group.Key.SortOrder,
                group.Select(item => item.Permission).Distinct().ToArray()))
            .ToArray();
    }
}
