import type { PersistedSubmission } from "../../../src/domain/submission";
import { buildNuomaYuanyiWeComMarkdown, buildWeComMarkdown } from "./wecom";

type NotificationEnvironment = Record<string, string | undefined>;

export interface ResolvedWeComNotification {
  webhookUrl: string | undefined;
  markdown: string;
  auditAction: "hospital_wecom_notification" | "nuoma_yuanyi_wecom_notification";
  failureLog: string;
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

  if (record.session.questionnaireVersion === "male-health-v1.0" && record.identity.phone) {
    return {
      webhookUrl: environment.HOSPITAL_WECHAT_WEBHOOK_URL,
      markdown: buildWeComMarkdown(record),
      auditAction: "hospital_wecom_notification",
      failureLog: "hospital WeCom notification failed",
    };
  }

  return null;
}
