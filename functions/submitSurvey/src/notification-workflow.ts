import type { PersistedSubmission } from "../../../src/domain/submission";
import type { ResolvedWeComNotification } from "./notification";
import { deliverFemaleClientReport, deliverHospitalClientReport, type ReportDeliveryStatus } from "./report-delivery";
import { sendWeComNotification } from "./wecom";

export type WeComNotificationStatus = ReportDeliveryStatus;
export type WeComAuditAction =
  | "hospital_wecom_notification"
  | "hospital_wecom_report_notification"
  | "hospital_female_wecom_notification"
  | "hospital_female_wecom_report_notification"
  | "nuoma_yuanyi_wecom_notification";

export interface WeComDeliveryAudit {
  action: WeComAuditAction;
  status: WeComNotificationStatus;
}

export interface WeComWorkflowDependencies {
  fontPath: string;
  sendMarkdown?: (webhookUrl: string, markdown: string) => Promise<void>;
  deliverReport?: (
    record: PersistedSubmission,
    webhookUrl: string | undefined,
    dependencies: { fontPath: string },
  ) => Promise<ReportDeliveryStatus>;
  deliverFemaleReport?: (
    record: PersistedSubmission,
    webhookUrl: string | undefined,
    dependencies: { fontPath: string },
  ) => Promise<ReportDeliveryStatus>;
  logError?: (message: string) => void;
}

export async function deliverResolvedWeComNotification(
  record: PersistedSubmission,
  notification: ResolvedWeComNotification,
  dependencies: WeComWorkflowDependencies,
): Promise<WeComDeliveryAudit[]> {
  if (!notification.webhookUrl) {
    return [
      { action: notification.auditAction, status: "not_configured" },
      ...(notification.report
        ? [{ action: notification.report.auditAction, status: "not_configured" as const }]
        : []),
    ];
  }

  const sendMarkdown = dependencies.sendMarkdown ?? sendWeComNotification;
  const deliverReport = dependencies.deliverReport ?? deliverHospitalClientReport;
  const deliverFemaleReport = dependencies.deliverFemaleReport ?? deliverFemaleClientReport;
  const logError = dependencies.logError ?? console.error;
  const audits: WeComDeliveryAudit[] = [];

  try {
    await sendMarkdown(notification.webhookUrl, notification.markdown);
    audits.push({ action: notification.auditAction, status: "sent" });
  } catch {
    logError(notification.failureLog);
    audits.push({ action: notification.auditAction, status: "failed" });
  }

  if (notification.report) {
    const status = notification.report.kind === "female"
      ? await deliverFemaleReport(record, notification.webhookUrl, { fontPath: dependencies.fontPath })
      : await deliverReport(record, notification.webhookUrl, { fontPath: dependencies.fontPath });
    audits.push({ action: notification.report.auditAction, status });
  }

  return audits;
}
