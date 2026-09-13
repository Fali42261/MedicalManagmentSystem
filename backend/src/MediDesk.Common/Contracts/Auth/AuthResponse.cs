namespace MediDesk.Common.Contracts.Auth;

public sealed record AuthResponse(
    string AccessToken,
    DateTime ExpiresAtUtc,
    AuthUser User,
    IReadOnlyCollection<MenuItemDto> Menu);

public sealed record AuthUser(long Id, string FullName, string Email, string Role);

public sealed record MenuItemDto(string Key, string Label, string Icon, string GroupName, int SortOrder, IReadOnlyCollection<string> Permissions);
