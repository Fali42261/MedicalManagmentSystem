using MediDesk.Common.Contracts.Administration;namespace MediDesk.Business.Interfaces;public interface ISettingsService{Task<IReadOnlyCollection<AppSettingDto>>GetAsync(CancellationToken ct);Task<IReadOnlyCollection<AppSettingDto>>UpdateAsync(Dictionary<string,string> values,long userId,CancellationToken ct);}

