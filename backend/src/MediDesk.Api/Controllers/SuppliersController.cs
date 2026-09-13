using System.IdentityModel.Tokens.Jwt;
using MediDesk.Api.Authorization;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Partners;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MediDesk.Api.Controllers;

[ApiController]
[Route("api/suppliers")]
public sealed class SuppliersController(ISupplierService service) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = PermissionPolicies.SuppliersView)]
    public async Task<ActionResult<PagedResponse<SupplierDto>>> GetPage([FromQuery] SupplierQuery query, CancellationToken cancellationToken)
    {
        try { return Ok(await service.GetPageAsync(query, cancellationToken)); }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
    }

    [HttpGet("{id:long}")]
    [Authorize(Policy = PermissionPolicies.SuppliersView)]
    public async Task<ActionResult<SupplierDto>> GetById(long id, CancellationToken cancellationToken)
    {
        var supplier = await service.GetByIdAsync(id, cancellationToken);
        return supplier is null ? NotFound() : Ok(supplier);
    }

    [HttpPost]
    [Authorize(Policy = PermissionPolicies.SuppliersAdd)]
    public async Task<ActionResult<SupplierDto>> Create(CreateSupplierRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var supplier = await service.CreateAsync(request, GetUserId(), cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
        }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
    }

    [HttpPut("{id:long}")]
    [Authorize(Policy = PermissionPolicies.SuppliersEdit)]
    public async Task<ActionResult<SupplierDto>> Update(long id, UpdateSupplierRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.UpdateAsync(id, request, GetUserId(), cancellationToken);
            if (result.NotFound) return NotFound();
            if (result.Conflict) return Conflict(new ProblemDetails { Title = "This supplier was changed by another user. Refresh and try again." });
            return Ok(await service.GetByIdAsync(id, cancellationToken));
        }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
    }

    [HttpDelete("{id:long}")]
    [Authorize(Policy = PermissionPolicies.SuppliersDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken) =>
        await service.DeleteAsync(id, GetUserId(), cancellationToken) ? NoContent() : NotFound();

    private long GetUserId() => long.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
