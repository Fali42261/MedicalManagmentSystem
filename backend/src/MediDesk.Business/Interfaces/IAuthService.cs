using MediDesk.Common.Contracts.Auth;

namespace MediDesk.Business.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<AuthResponse> SignupAsync(SignupRequest request, CancellationToken cancellationToken);
}
