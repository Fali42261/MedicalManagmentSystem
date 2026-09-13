using MediDesk.Business.Interfaces; using MediDesk.Common.Contracts.Catalog; using MediDesk.Common.Contracts.Operations;
namespace MediDesk.Business.Services;
public sealed class ReturnService(IReturnRepository repo):IReturnService { public Task<PagedResponse<SaleReturnDto>> GetPageAsync(ReturnQuery q,CancellationToken ct)=>repo.GetPageAsync(q with{Search=q.Search?.Trim(),Page=Math.Max(1,q.Page),PageSize=Math.Clamp(q.PageSize,1,200)},ct); public Task<SaleReturnDto> CreateSaleReturnAsync(CreateSaleReturnRequest r,long u,CancellationToken ct)=>repo.CreateSaleReturnAsync(r,u,ct); }

