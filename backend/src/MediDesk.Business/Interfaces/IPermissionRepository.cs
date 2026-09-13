namespace MediDesk.Business.Interfaces;

public interface IPermissionRepository
{
    Task<bool> HasPermissionAsync(long userId, string moduleKey, string permission, CancellationToken cancellationToken);
}
