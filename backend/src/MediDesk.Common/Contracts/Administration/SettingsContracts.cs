using System.ComponentModel.DataAnnotations;namespace MediDesk.Common.Contracts.Administration;public sealed record AppSettingDto(string Key,string Value,DateTime UpdatedAtUtc);public sealed record UpdateSettingsRequest([Required]Dictionary<string,string> Values);

