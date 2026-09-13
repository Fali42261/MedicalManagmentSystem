using MediDesk.Common.Contracts.Auth;

namespace MediDesk.Business.Interfaces;

public interface INavigationService
{
    Task<IReadOnlyCollection<MenuItemDto>> GetForUserAsync(long userId, CancellationToken cancellationToken);
}
