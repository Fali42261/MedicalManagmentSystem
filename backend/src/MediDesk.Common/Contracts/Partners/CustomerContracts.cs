using System.ComponentModel.DataAnnotations;
using MediDesk.Common.Contracts.Catalog;
namespace MediDesk.Common.Contracts.Partners;
public sealed record CustomerDto(long Id,string Code,string FullName,string Phone,string Email,string Address,string City,string State,decimal CreditLimit,decimal CreditBalance,bool IsActive,DateTime UpdatedAtUtc,string RowVersion);
public sealed record CreateCustomerRequest([Required,StringLength(160,MinimumLength=2)] string FullName,[Required,StringLength(18,MinimumLength=10),RegularExpression("^[+0-9 ()-]{10,18}$")] string Phone,[EmailAddress,StringLength(256)] string? Email,[StringLength(300)] string? Address,[StringLength(100)] string? City,[StringLength(100)] string? State,[Range(0,999999999999)] decimal CreditLimit);
public sealed record UpdateCustomerRequest([Required,StringLength(160,MinimumLength=2)] string FullName,[Required,StringLength(18,MinimumLength=10),RegularExpression("^[+0-9 ()-]{10,18}$")] string Phone,[EmailAddress,StringLength(256)] string? Email,[StringLength(300)] string? Address,[StringLength(100)] string? City,[StringLength(100)] string? State,[Range(0,999999999999)] decimal CreditLimit,bool IsActive,[Required] string RowVersion);
public sealed record CustomerQuery(string? Search=null,string? Status=null,int Page=1,int PageSize=100);
public sealed record CustomerWriteResult(bool Success,bool NotFound=false,bool Conflict=false);

