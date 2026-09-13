using MediDesk.Common.Contracts.Administration;using MediDesk.Common.Contracts.Catalog;namespace MediDesk.Business.Interfaces;public interface IStoreRepository{Task<PagedResponse<StoreDto>>GetPageAsync(StoreQuery q,CancellationToken ct);Task<StoreDto>CreateAsync(CreateStoreRequest r,long u,CancellationToken ct);}

