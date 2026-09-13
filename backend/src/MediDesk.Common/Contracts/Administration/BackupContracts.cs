using MediDesk.Common.Contracts.Catalog;namespace MediDesk.Common.Contracts.Administration;public sealed record BackupDto(long Id,string BackupNumber,string Type,long SizeBytes,DateTime CreatedAtUtc,string Status);public sealed record CreateBackupRequest(string Type="Full");public sealed record BackupQuery(int Page=1,int PageSize=100);

