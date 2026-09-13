using System.IdentityModel.Tokens.Jwt;
using MediDesk.Api.Authorization;
using MediDesk.Business.Interfaces;
using MediDesk.Common.Contracts.Catalog;
using MediDesk.Common.Contracts.Operations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MediDesk.Api.Controllers;

[ApiController]
[Route("api/sales")]
public sealed class SalesController(ISaleService service, IMedicineService medicineService) : ControllerBase
{
    [HttpGet("catalog")]
    [Authorize(Policy = PermissionPolicies.SalesView)]
    public async Task<ActionResult<PagedResponse<MedicineDto>>> GetCatalog(CancellationToken cancellationToken) =>
        Ok(await medicineService.GetPageAsync(new MedicineQuery(PageSize: 200, SortBy: "name"), cancellationToken));

    [HttpGet]
    [Authorize(Policy = PermissionPolicies.SalesView)]
    public async Task<ActionResult<PagedResponse<SaleSummaryDto>>> GetPage([FromQuery] SaleQuery query, CancellationToken cancellationToken)
    {
        try { return Ok(await service.GetPageAsync(query, cancellationToken)); }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
    }

    [HttpGet("{id:long}")]
    [Authorize(Policy = PermissionPolicies.SalesView)]
    public async Task<ActionResult<SaleDto>> GetById(long id, CancellationToken cancellationToken)
    {
        var sale = await service.GetByIdAsync(id, cancellationToken);
        return sale is null ? NotFound() : Ok(sale);
    }

    [HttpPost]
    [Authorize(Policy = PermissionPolicies.SalesAdd)]
    public async Task<ActionResult<SaleDto>> Create(CreateSaleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var sale = await service.CreateAsync(request, GetUserId(), cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = sale.Id }, sale);
        }
        catch (ArgumentException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
        catch (KeyNotFoundException exception) { return BadRequest(new ProblemDetails { Title = exception.Message }); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
        catch (OverflowException) { return BadRequest(new ProblemDetails { Title = "The stock quantity is too large." }); }
    }

    [HttpDelete("{id:long}")]
    [Authorize(Policy = PermissionPolicies.SalesDelete)]
    public async Task<IActionResult> Cancel(long id, CancellationToken cancellationToken)
    {
        try { return await service.CancelAsync(id, GetUserId(), cancellationToken) ? NoContent() : NotFound(); }
        catch (InvalidOperationException exception) { return Conflict(new ProblemDetails { Title = exception.Message }); }
        catch (OverflowException) { return Conflict(new ProblemDetails { Title = "Stock capacity prevents this cancellation." }); }
    }

    private long GetUserId() => long.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
