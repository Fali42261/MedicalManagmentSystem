using System.IdentityModel.Tokens.Jwt;
using MediDesk.Business.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace MediDesk.Api.Authorization;

public static class PermissionPolicies
{
    public const string MedicinesView = "medicines:view";
    public const string MedicinesAdd = "medicines:add";
    public const string MedicinesEdit = "medicines:edit";
    public const string MedicinesDelete = "medicines:delete";
    public const string InventoryView = "inventory:view";
    public const string InventoryEdit = "inventory:edit";
    public const string MastersView = "masters:view";
    public const string MastersAdd = "masters:add";
    public const string MastersEdit = "masters:edit";
    public const string MastersDelete = "masters:delete";
    public const string SuppliersView = "suppliers:view";
    public const string SuppliersAdd = "suppliers:add";
    public const string SuppliersEdit = "suppliers:edit";
    public const string SuppliersDelete = "suppliers:delete";
}

public sealed record PermissionRequirement(string ModuleKey, string Permission) : IAuthorizationRequirement;

public sealed class PermissionAuthorizationHandler(IPermissionRepository repository, IHttpContextAccessor httpContextAccessor)
    : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var subject = context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (!long.TryParse(subject, out var userId)) return;
        var cancellationToken = httpContextAccessor.HttpContext?.RequestAborted ?? CancellationToken.None;
        if (await repository.HasPermissionAsync(userId, requirement.ModuleKey, requirement.Permission, cancellationToken))
            context.Succeed(requirement);
    }
}
