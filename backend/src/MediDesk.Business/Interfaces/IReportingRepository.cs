using MediDesk.Common.Contracts.Reporting;namespace MediDesk.Business.Interfaces;public interface IReportingRepository{Task<ReportSummaryDto>GetSummaryAsync(ReportQuery q,CancellationToken ct);Task<ComplianceSummaryDto>GetComplianceAsync(ReportQuery q,CancellationToken ct);}

