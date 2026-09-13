using System.IdentityModel.Tokens.Jwt;
using MediDesk.Api.Authorization;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Masters;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MediDesk.Api.Controllers;

[ApiController]
[Route("api/medicine-masters")]
public sealed class MedicineMastersController(IMedicineMasterService service) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = PermissionPolicies.MastersView)]
    public async Task<ActionResult<PagedResponse<MedicineMasterDto>>> GetPage([FromQuery] MedicineMasterQuery query, CancellationToken cancellationToken) =>
        Ok(await service.GetPageAsync(query, cancellationToken));

    [HttpGet("{id:long}")]
    [Authorize(Policy = PermissionPolicies.MastersView)]
    public async Task<ActionResult<MedicineMasterDto>> GetById(long id, CancellationToken cancellationToken)
    {
        var result = await service.GetByIdAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = PermissionPolicies.MastersAdd)]
    public async Task<ActionResult<MedicineMasterDto>> Create(CreateMedicineMasterRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.CreateAsync(request, GetUserId(), cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
    }

    [HttpPut("{id:long}")]
    [Authorize(Policy = PermissionPolicies.MastersEdit)]
    public async Task<ActionResult<MedicineMasterDto>> Update(long id, UpdateMedicineMasterRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var write = await service.UpdateAsync(id, request, GetUserId(), cancellationToken);
            if (write.NotFound) return NotFound();
            if (write.Conflict) return Conflict(new ProblemDetails { Title = "This master was changed by another user. Refresh and try again." });
            return Ok(await service.GetByIdAsync(id, cancellationToken));
        }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
    }

    [HttpDelete("{id:long}")]
    [Authorize(Policy = PermissionPolicies.MastersDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken)
    {
        try { return await service.DeleteAsync(id, GetUserId(), cancellationToken) ? NoContent() : NotFound(); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
    }

    private long GetUserId() => long.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
