namespace MediDesk.Common.Models;

public sealed record UserRecord(long Id, string FullName, string Email, string PasswordHash, string RoleName, bool IsActive);

public sealed record NavigationRecord(string Key, string Label, string Icon, string GroupName, int SortOrder, string Permission);
