using MediDesk.Common.Contracts.Administration;using MediDesk.Common.Contracts.Catalog;namespace MediDesk.Business.Interfaces;public interface IUserAdminRepository{Task<PagedResponse<UserAdminDto>>GetPageAsync(UserAdminQuery q,CancellationToken ct);Task<bool>UpdateAsync(long id,UpdateUserAdminRequest r,long u,CancellationToken ct);}

