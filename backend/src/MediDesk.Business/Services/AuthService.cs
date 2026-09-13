using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Auth;
using MediDesk.Common.Models;
using MediDesk.Common.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace MediDesk.Business.Services;

public sealed class AuthService(
    IAuthRepository repository,
    INavigationService navigationService,
    IPasswordHasher<UserRecord> passwordHasher,
    IOptions<JwtOptions> jwtOptions) : IAuthService
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await repository.GetUserByEmailAsync(NormalizeEmail(request.Email), cancellationToken);
        if (user is null || !user.IsActive) return null;

        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        return result == PasswordVerificationResult.Failed
            ? null
            : await CreateResponseAsync(user, cancellationToken);
    }

    public async Task<AuthResponse> SignupAsync(SignupRequest request, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        if (await repository.EmailExistsAsync(email, cancellationToken))
            throw new InvalidOperationException("An account with this email already exists.");

        var pending = new UserRecord(0, request.FullName.Trim(), email, string.Empty, "Billing Operator", true);
        var hash = passwordHasher.HashPassword(pending, request.Password);
        var user = await repository.CreateUserAsync(pending.FullName, email, hash, cancellationToken);
        return await CreateResponseAsync(user, cancellationToken);
    }

    private async Task<AuthResponse> CreateResponseAsync(UserRecord user, CancellationToken cancellationToken)
    {
        var expires = DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.RoleName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.SigningKey)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(_jwt.Issuer, _jwt.Audience, claims, expires: expires, signingCredentials: credentials);
        var menu = await navigationService.GetForUserAsync(user.Id, cancellationToken);
        return new AuthResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            expires,
            new AuthUser(user.Id, user.FullName, user.Email, user.RoleName),
            menu);
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
