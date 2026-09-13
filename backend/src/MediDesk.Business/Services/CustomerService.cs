using MediDesk.Business.Interfaces; using MediDesk.Common.Contracts.Catalog; using MediDesk.Common.Contracts.Partners;
namespace MediDesk.Business.Services;
public sealed class CustomerService(ICustomerRepository repo):ICustomerService {
 public Task<PagedResponse<CustomerDto>> GetPageAsync(CustomerQuery q,CancellationToken ct){var s=q.Status?.Trim(); if(!string.IsNullOrWhiteSpace(s)&&!s.Equals("Active",StringComparison.OrdinalIgnoreCase)&&!s.Equals("Inactive",StringComparison.OrdinalIgnoreCase)) throw new ArgumentException("Customer status must be Active or Inactive."); return repo.GetPageAsync(q with{Search=q.Search?.Trim(),Status=string.IsNullOrWhiteSpace(s)?null:(s.Equals("Active",StringComparison.OrdinalIgnoreCase)?"Active":"Inactive"),Page=Math.Max(1,q.Page),PageSize=Math.Clamp(q.PageSize,1,200)},ct);}
 public Task<CustomerDto?> GetByIdAsync(long id,CancellationToken ct)=>repo.GetByIdAsync(id,ct);
 public Task<CustomerDto> CreateAsync(CreateCustomerRequest r,long u,CancellationToken ct)=>repo.CreateAsync(Normalize(r),u,ct);
 public Task<CustomerWriteResult> UpdateAsync(long id,UpdateCustomerRequest r,long u,CancellationToken ct){Validate(r.RowVersion); return repo.UpdateAsync(id,Normalize(r),u,ct);}
 public Task<bool> DeleteAsync(long id,long u,CancellationToken ct)=>repo.SoftDeleteAsync(id,u,ct);
 static CreateCustomerRequest Normalize(CreateCustomerRequest r)=>r with{FullName=r.FullName.Trim(),Phone=r.Phone.Trim(),Email=Opt(r.Email)?.ToLowerInvariant(),Address=Opt(r.Address),City=Opt(r.City),State=Opt(r.State)};
 static UpdateCustomerRequest Normalize(UpdateCustomerRequest r)=>r with{FullName=r.FullName.Trim(),Phone=r.Phone.Trim(),Email=Opt(r.Email)?.ToLowerInvariant(),Address=Opt(r.Address),City=Opt(r.City),State=Opt(r.State)};
 static string? Opt(string? s)=>string.IsNullOrWhiteSpace(s)?null:s.Trim(); static void Validate(string v){try{if(Convert.FromBase64String(v).Length==8)return;}catch{} throw new ArgumentException("The customer version is invalid.");}
}

