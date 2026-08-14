import type { PersistedSubmission } from "../../../src/domain/submission";
import { buildFemaleWeComMarkdown, buildNuomaYuanyiWeComMarkdown, buildWeComMarkdown } from "./wecom";

type NotificationEnvironment = Record<string, string | undefined>;

export interface ResolvedWeComNotification {
  webhookUrl: string | undefined;
  markdown: string;
  auditAction: "hospital_wecom_notification" | "hospital_female_wecom_notification" | "nuoma_yuanyi_wecom_notification";
  failureLog: string;
  report?: {
    kind: "male" | "female";
    auditAction: "hospital_wecom_report_notification" | "hospital_female_wecom_report_notification";
    failureLog: string;
  };
}

export function resolveWeComNotification(
  record: PersistedSubmission,
  environment: NotificationEnvironment,
): ResolvedWeComNotification | null {
  if (record.session.questionnaireVersion === "nuoma-yuanyi-male-health-v1.0") {
    return {
      webhookUrl: environment.NUOMA_YUANYI_WECOM_WEBHOOK_URL,
      markdown: buildNuomaYuanyiWeComMarkdown(record),
      auditAction: "nuoma_yuanyi_wecom_notification",
      failureLog: "Nuoma Yuanyi WeCom notification failed",
    };
  }

  if (record.session.questionnaireVersion === "female-health-v1.0" && record.identity.phone) {
    return {
      webhookUrl: environment.HOSPITAL_WECHAT_WEBHOOK_URL,
      markdown: buildFemaleWeComMarkdown(record),
      auditAction: "hospital_female_wecom_notification",
      failureLog: "hospital female WeCom notification failed",
      report: {
        kind: "female",
        auditAction: "hospital_female_wecom_report_notification",
        failureLog: "hospital female WeCom PDF report delivery failed",
      },
    };
  }

  if (record.session.questionnaireVersion === "male-health-v1.0" && record.identity.phone) {
    return {
      webhookUrl: environment.HOSPITAL_WECHAT_WEBHOOK_URL,
      markdown: buildWeComMarkdown(record),
      auditAction: "hospital_wecom_notification",
      failureLog: "hospital WeCom notification failed",
      report: {
        kind: "male",
        auditAction: "hospital_wecom_report_notification",
        failureLog: "hospital WeCom PDF report delivery failed",
      },
    };
  }

  return null;
}
