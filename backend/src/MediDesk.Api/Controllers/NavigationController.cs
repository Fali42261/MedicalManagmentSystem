using System.IdentityModel.Tokens.Jwt;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MediDesk.Api.Controllers;

[ApiController]
[Route("api/navigation")]
[Authorize]
public sealed class NavigationController(INavigationService navigationService) : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType<IReadOnlyCollection<MenuItemDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<MenuItemDto>>> GetMine(CancellationToken cancellationToken)
    {
        var subject = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        return long.TryParse(subject, out var userId)
            ? Ok(await navigationService.GetForUserAsync(userId, cancellationToken))
            : Unauthorized();
    }
}
