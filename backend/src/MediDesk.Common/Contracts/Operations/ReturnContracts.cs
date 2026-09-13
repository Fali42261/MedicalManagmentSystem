using System.ComponentModel.DataAnnotations;
using MediDesk.Common.Contracts.Catalog;
namespace MediDesk.Common.Contracts.Operations;
public sealed record CreateSaleReturnRequest([Range(1,long.MaxValue)] long SaleId,[Required,StringLength(300,MinimumLength=3)] string Reason,[Required,MinLength(1)] IReadOnlyCollection<SaleReturnLineRequest> Items);
public sealed record SaleReturnLineRequest([Range(1,long.MaxValue)] long SaleItemId,[Range(1,int.MaxValue)] int Quantity);
public sealed record SaleReturnDto(long Id,string ReturnNumber,long SaleId,string InvoiceNumber,string CustomerName,string Reason,decimal Amount,string Status,DateTime CreatedAtUtc,IReadOnlyCollection<SaleReturnLineDto> Items);
public sealed record SaleReturnLineDto(long SaleItemId,long MedicineId,string MedicineName,int Quantity,decimal LineTotal);
public sealed record ReturnQuery(string? Search=null,int Page=1,int PageSize=100);

