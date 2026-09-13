using MediDesk.Common.Contracts.Catalog;using MediDesk.Common.Contracts.Finance;namespace MediDesk.Business.Interfaces;public interface IAccountRepository{Task<PagedResponse<AccountEntryDto>>GetPageAsync(AccountQuery q,CancellationToken ct);Task<AccountEntryDto>CreateAsync(CreateAccountEntryRequest r,long u,CancellationToken ct);}

