using MediDesk.Business.Interfaces;
using MediDesk.Common.Models;
using MediDesk.Common.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace MediDesk.Api.Services;

public sealed class BootstrapAdminService(
    IServiceScopeFactory scopeFactory,
    IOptions<BootstrapAdminOptions> options,
    ILogger<BootstrapAdminService> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var admin = options.Value;
        if (string.IsNullOrWhiteSpace(admin.Email) || string.IsNullOrWhiteSpace(admin.Password))
        {
            logger.LogWarning("Bootstrap administrator is not configured. Set BootstrapAdmin environment values before first use.");
            return;
        }

        using var scope = scopeFactory.CreateScope();
        var repository = scope.ServiceProvider.GetRequiredService<IAuthRepository>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<UserRecord>>();
        var pending = new UserRecord(0, admin.FullName, admin.Email, string.Empty, "Administrator", true);
        var hash = hasher.HashPassword(pending, admin.Password);
        await repository.EnsureBootstrapAdminAsync(admin.FullName, admin.Email.Trim().ToLowerInvariant(), hash, cancellationToken);
        logger.LogInformation("Bootstrap administrator is available.");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
