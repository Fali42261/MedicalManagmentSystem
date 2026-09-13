namespace MediDesk.Common.Contracts.Reporting;
public sealed record ReportSummaryDto(decimal TotalSales,decimal TotalPurchases,decimal GrossProfit,decimal StockValue,decimal OutputGst,decimal InputGst,IReadOnlyCollection<ReportMedicineDto> TopMedicines);
public sealed record ReportMedicineDto(string Name,int Units,decimal Sales,decimal Profit);
public sealed record ComplianceSummaryDto(decimal TaxableSales,decimal OutputGst,decimal InputGst,decimal NetPayable,int SalesCount,int PurchaseCount);
public sealed record ReportQuery(DateTime? From=null,DateTime? To=null);

