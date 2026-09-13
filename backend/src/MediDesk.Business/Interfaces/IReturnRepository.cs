using MediDesk.Common.Contracts.Catalog; using MediDesk.Common.Contracts.Operations;
namespace MediDesk.Business.Interfaces;
public interface IReturnRepository { Task<PagedResponse<SaleReturnDto>> GetPageAsync(ReturnQuery q,CancellationToken ct); Task<SaleReturnDto> CreateSaleReturnAsync(CreateSaleReturnRequest r,long uid,CancellationToken ct); }

