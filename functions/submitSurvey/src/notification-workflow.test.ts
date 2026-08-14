// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { PersistedSubmission } from "../../../src/domain/submission";
import type { ResolvedWeComNotification } from "./notification";
import { deliverResolvedWeComNotification } from "./notification-workflow";

const record = {
  session: {
    clientSubmissionId: "notification-workflow-0001",
    confirmationId: "JS-WORKFLOW-TEST",
    questionnaireVersion: "male-health-v1.0",
    submittedAt: "2026-08-13T03:00:00.000Z",
    hasRedFlag: false,
  },
  identity: { name: "虚构用户", age: null, phone: "13800138000", phoneLast4: "8000" },
  healthAnswers: {},
  assessment: { domains: [], hasRedFlag: false, redFlags: [] },
} satisfies PersistedSubmission;

const hospitalNotification: ResolvedWeComNotification = {
  webhookUrl: "hospital-webhook",
  markdown: "hospital-markdown",
  auditAction: "hospital_wecom_notification",
  failureLog: "hospital summary failed",
  report: {
    kind: "male",
    auditAction: "hospital_wecom_report_notification",
    failureLog: "hospital PDF failed",
  },
};

describe("resolved WeCom notification workflow", () => {
  it("returns independent summary and PDF audit results for hospital records", async () => {
    const sendMarkdown = vi.fn(async () => undefined);
    const deliverReport = vi.fn(async () => "sent" as const);

    await expect(deliverResolvedWeComNotification(record, hospitalNotification, {
      fontPath: "/fonts/noto.otf",
      sendMarkdown,
      deliverReport,
    })).resolves.toEqual([
      { action: "hospital_wecom_notification", status: "sent" },
      { action: "hospital_wecom_report_notification", status: "sent" },
    ]);
    expect(sendMarkdown).toHaveBeenCalledWith("hospital-webhook", "hospital-markdown");
    expect(deliverReport).toHaveBeenCalledWith(record, "hospital-webhook", { fontPath: "/fonts/noto.otf" });
  });

  it("continues to the PDF when the summary message fails", async () => {
    const logError = vi.fn();
    const deliverReport = vi.fn(async () => "sent" as const);

    await expect(deliverResolvedWeComNotification(record, hospitalNotification, {
      fontPath: "/fonts/noto.otf",
      sendMarkdown: vi.fn(async () => { throw new Error("upstream sensitive response"); }),
      deliverReport,
      logError,
    })).resolves.toEqual([
      { action: "hospital_wecom_notification", status: "failed" },
      { action: "hospital_wecom_report_notification", status: "sent" },
    ]);
    expect(deliverReport).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith("hospital summary failed");
    expect(JSON.stringify(logError.mock.calls)).not.toContain("upstream sensitive response");
  });

  it("audits missing configuration without making network or PDF calls", async () => {
    const sendMarkdown = vi.fn();
    const deliverReport = vi.fn();

    await expect(deliverResolvedWeComNotification(record, {
      ...hospitalNotification,
      webhookUrl: undefined,
    }, {
      fontPath: "/fonts/noto.otf",
      sendMarkdown,
      deliverReport,
    })).resolves.toEqual([
      { action: "hospital_wecom_notification", status: "not_configured" },
      { action: "hospital_wecom_report_notification", status: "not_configured" },
    ]);
    expect(sendMarkdown).not.toHaveBeenCalled();
    expect(deliverReport).not.toHaveBeenCalled();
  });

  it("keeps Nuoma routing to one summary audit without a hospital PDF", async () => {
    const deliverReport = vi.fn();
    const nuomaNotification: ResolvedWeComNotification = {
      webhookUrl: "nuoma-webhook",
      markdown: "nuoma-markdown",
      auditAction: "nuoma_yuanyi_wecom_notification",
      failureLog: "nuoma summary failed",
    };

    await expect(deliverResolvedWeComNotification(record, nuomaNotification, {
      fontPath: "/fonts/noto.otf",
      sendMarkdown: vi.fn(async () => undefined),
      deliverReport,
    })).resolves.toEqual([
      { action: "nuoma_yuanyi_wecom_notification", status: "sent" },
    ]);
    expect(deliverReport).not.toHaveBeenCalled();
  });

  it("dispatches female reports through the female renderer", async () => {
    const deliverReport = vi.fn();
    const deliverFemaleReport = vi.fn(async () => "sent" as const);
    const notification: ResolvedWeComNotification = {
      webhookUrl: "hospital-webhook",
      markdown: "female-markdown",
      auditAction: "hospital_female_wecom_notification",
      failureLog: "female summary failed",
      report: { kind: "female", auditAction: "hospital_female_wecom_report_notification", failureLog: "female PDF failed" },
    };

    await expect(deliverResolvedWeComNotification(record, notification, {
      fontPath: "/fonts/noto.otf",
      sendMarkdown: vi.fn(async () => undefined),
      deliverReport,
      deliverFemaleReport,
    })).resolves.toEqual([
      { action: "hospital_female_wecom_notification", status: "sent" },
      { action: "hospital_female_wecom_report_notification", status: "sent" },
    ]);
    expect(deliverFemaleReport).toHaveBeenCalledWith(record, "hospital-webhook", { fontPath: "/fonts/noto.otf" });
    expect(deliverReport).not.toHaveBeenCalled();
  });
});
