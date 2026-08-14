// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { PersistedSubmission } from "../../../src/domain/submission";
import { resolveWeComNotification } from "./notification";

const baseRecord: PersistedSubmission = {
  session: {
    clientSubmissionId: "test-submission-0001",
    confirmationId: "JS-TEST-0001",
    questionnaireVersion: "nuoma-yuanyi-male-health-v1.0",
    submittedAt: "2026-08-13T03:00:00.000Z",
    hasRedFlag: false,
  },
  identity: { name: "系统测试", age: 45, phoneLast4: "8000" },
  healthAnswers: { twelveWeekGoals: ["0", "5", "8"] },
  assessment: { domains: [], hasRedFlag: false, redFlags: [] },
};

describe("WeCom notification routing", () => {
  it("routes Nuoma submissions to the independent webhook and audit action", () => {
    const resolved = resolveWeComNotification(baseRecord, {
      NUOMA_YUANYI_WECOM_WEBHOOK_URL: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=nuoma-test",
      HOSPITAL_WECHAT_WEBHOOK_URL: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=hospital-test",
    });

    expect(resolved).toMatchObject({
      webhookUrl: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=nuoma-test",
      auditAction: "nuoma_yuanyi_wecom_notification",
      failureLog: "Nuoma Yuanyi WeCom notification failed",
    });
    expect(resolved?.markdown).toContain("诺玛元一｜新问卷概要");
  });

  it("preserves the hospital route for records with a full phone", () => {
    const resolved = resolveWeComNotification({
      ...baseRecord,
      session: { ...baseRecord.session, questionnaireVersion: "male-health-v1.0" },
      identity: { ...baseRecord.identity, phone: "13800138000" },
    }, { HOSPITAL_WECHAT_WEBHOOK_URL: "hospital-webhook" });

    expect(resolved).toMatchObject({
      webhookUrl: "hospital-webhook",
      auditAction: "hospital_wecom_notification",
    });
    expect(resolved?.markdown).toContain("建始民族医院｜新问卷");
  });

  it("returns a configured route without a URL so missing configuration can be audited", () => {
    expect(resolveWeComNotification(baseRecord, {})).toMatchObject({
      webhookUrl: undefined,
      auditAction: "nuoma_yuanyi_wecom_notification",
    });
  });

  it("does not notify unsupported records or legacy hospital records without a phone", () => {
    expect(resolveWeComNotification({
      ...baseRecord,
      session: { ...baseRecord.session, questionnaireVersion: "unknown" },
    }, {})).toBeNull();
    expect(resolveWeComNotification({
      ...baseRecord,
      session: { ...baseRecord.session, questionnaireVersion: "male-health-v1.0" },
    }, {})).toBeNull();
  });
});
