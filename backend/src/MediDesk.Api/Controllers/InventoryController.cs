using System.IdentityModel.Tokens.Jwt;
using MediDesk.Api.Authorization;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MediDesk.Api.Controllers;

[ApiController]
[Route("api/inventory")]
public sealed class InventoryController(IInventoryService service) : ControllerBase
{
    [HttpGet("movements")]
    [Authorize(Policy = PermissionPolicies.InventoryView)]
    public async Task<ActionResult<IReadOnlyCollection<StockMovementDto>>> GetMovements([FromQuery] int take = 30, CancellationToken cancellationToken = default) =>
        Ok(await service.GetRecentMovementsAsync(take, cancellationToken));

    [HttpPost("adjustments")]
    [Authorize(Policy = PermissionPolicies.InventoryEdit)]
    public async Task<ActionResult<StockAdjustmentResponse>> Adjust(StockAdjustmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await service.AdjustAsync(request, GetUserId(), cancellationToken));
        }
        catch (KeyNotFoundException exception) { return NotFound(new ProblemDetails { Title = exception.Message }); }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
        catch (OverflowException) { return BadRequest(new ProblemDetails { Title = "The resulting stock exceeds the supported limit." }); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
    }

    private long GetUserId() => long.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
