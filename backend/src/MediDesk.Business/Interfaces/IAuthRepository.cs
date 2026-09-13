using MediDesk.Common.Models;

namespace MediDesk.Business.Interfaces;

public interface IAuthRepository
{
    Task<UserRecord?> GetUserByEmailAsync(string email, CancellationToken cancellationToken);
    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken);
    Task<UserRecord> CreateUserAsync(string fullName, string email, string passwordHash, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<NavigationRecord>> GetNavigationAsync(long userId, CancellationToken cancellationToken);
    Task EnsureBootstrapAdminAsync(string fullName, string email, string passwordHash, CancellationToken cancellationToken);
}
