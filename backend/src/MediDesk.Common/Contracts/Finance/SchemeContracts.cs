using System.ComponentModel.DataAnnotations; using MediDesk.Common.Contracts.Catalog;
namespace MediDesk.Common.Contracts.Finance;
public sealed record SchemeDto(long Id,string Code,string Name,string AppliesTo,string SchemeType,decimal Value,DateOnly ValidFrom,DateOnly ValidUntil,bool IsActive,string RowVersion);
public sealed record CreateSchemeRequest([Required,StringLength(160,MinimumLength=2)] string Name,[Required,StringLength(80)] string AppliesTo,[Required,StringLength(30)] string SchemeType,[Range(0,100)] decimal Value,DateOnly ValidFrom,DateOnly ValidUntil);
public sealed record UpdateSchemeRequest([Required,StringLength(160,MinimumLength=2)] string Name,[Required,StringLength(80)] string AppliesTo,[Required,StringLength(30)] string SchemeType,[Range(0,100)] decimal Value,DateOnly ValidFrom,DateOnly ValidUntil,bool IsActive,[Required] string RowVersion);
public sealed record SchemeQuery(string? Search=null,string? Status=null,int Page=1,int PageSize=100); public sealed record SchemeWriteResult(bool Success,bool NotFound=false,bool Conflict=false);

