using MediDesk.Common.Contracts.Administration;using MediDesk.Common.Contracts.Catalog;namespace MediDesk.Business.Interfaces;public interface IBackupRepository{Task<PagedResponse<BackupDto>>GetPageAsync(BackupQuery q,CancellationToken ct);Task<BackupDto>CreateAsync(string type,long u,CancellationToken ct);}

