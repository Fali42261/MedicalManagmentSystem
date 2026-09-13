using System.IdentityModel.Tokens.Jwt;
using MediDesk.Api.Authorization;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MediDesk.Api.Controllers;

[ApiController]
[Route("api/medicines")]
public sealed class MedicinesController(IMedicineService service) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = PermissionPolicies.MedicinesView)]
    public async Task<ActionResult<PagedResponse<MedicineDto>>> GetPage([FromQuery] MedicineQuery query, CancellationToken cancellationToken) =>
        Ok(await service.GetPageAsync(query, cancellationToken));

    [HttpGet("{id:long}")]
    [Authorize(Policy = PermissionPolicies.MedicinesView)]
    public async Task<ActionResult<MedicineDto>> GetById(long id, CancellationToken cancellationToken)
    {
        var medicine = await service.GetByIdAsync(id, cancellationToken);
        return medicine is null ? NotFound() : Ok(medicine);
    }

    [HttpPost]
    [Authorize(Policy = PermissionPolicies.MedicinesAdd)]
    public async Task<ActionResult<MedicineDto>> Create(CreateMedicineRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var medicine = await service.CreateAsync(request, GetUserId(), cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = medicine.Id }, medicine);
        }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
    }

    [HttpPut("{id:long}")]
    [Authorize(Policy = PermissionPolicies.MedicinesEdit)]
    public async Task<ActionResult<MedicineDto>> Update(long id, UpdateMedicineRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await service.UpdateAsync(id, request, GetUserId(), cancellationToken);
            if (result.NotFound) return NotFound();
            if (result.Conflict) return Conflict(new ProblemDetails { Title = "This medicine was changed by another user. Refresh and try again." });
            return Ok(await service.GetByIdAsync(id, cancellationToken));
        }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
    }

    [HttpDelete("{id:long}")]
    [Authorize(Policy = PermissionPolicies.MedicinesDelete)]
    public async Task<IActionResult> Delete(long id, CancellationToken cancellationToken) =>
        await service.DeleteAsync(id, GetUserId(), cancellationToken) ? NoContent() : NotFound();

    private long GetUserId() => long.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
