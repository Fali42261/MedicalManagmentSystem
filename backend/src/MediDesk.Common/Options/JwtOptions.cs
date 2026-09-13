namespace MediDesk.Common.Options;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string SigningKey { get; init; } = string.Empty;
    public int ExpiryMinutes { get; init; } = 60;
}

public sealed class BootstrapAdminOptions
{
    public const string SectionName = "BootstrapAdmin";
    public string FullName { get; init; } = "System Administrator";
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}
