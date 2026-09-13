using System.IdentityModel.Tokens.Jwt;
using MediDesk.Api.Authorization;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Operations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MediDesk.Api.Controllers;

[ApiController]
[Route("api/purchases")]
public sealed class PurchasesController(IPurchaseService service) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = PermissionPolicies.PurchasesView)]
    public async Task<ActionResult<PagedResponse<PurchaseSummaryDto>>> GetPage([FromQuery] PurchaseQuery query, CancellationToken cancellationToken)
    {
        try { return Ok(await service.GetPageAsync(query, cancellationToken)); }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
    }

    [HttpGet("{id:long}")]
    [Authorize(Policy = PermissionPolicies.PurchasesView)]
    public async Task<ActionResult<PurchaseDto>> GetById(long id, CancellationToken cancellationToken)
    {
        var purchase = await service.GetByIdAsync(id, cancellationToken);
        return purchase is null ? NotFound() : Ok(purchase);
    }

    [HttpPost]
    [Authorize(Policy = PermissionPolicies.PurchasesAdd)]
    public async Task<ActionResult<PurchaseDto>> Create(CreatePurchaseRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var purchase = await service.CreateAsync(request, GetUserId(), cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = purchase.Id }, purchase);
        }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
        catch (KeyNotFoundException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
        catch (OverflowException) { return BadRequest(new ProblemDetails { Title = "The received quantity is too large." }); }
    }

    [HttpDelete("{id:long}")]
    [Authorize(Policy = PermissionPolicies.PurchasesDelete)]
    public async Task<IActionResult> Cancel(long id, CancellationToken cancellationToken)
    {
        try { return await service.CancelAsync(id, GetUserId(), cancellationToken) ? NoContent() : NotFound(); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
    }

    private long GetUserId() => long.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
