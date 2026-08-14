// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { PersistedSubmission } from "../../../src/domain/submission";
import type { HospitalClientReportModel } from "./report-model";
import { deliverHospitalClientReport } from "./report-delivery";
import { WeComDeliveryError } from "./wecom";

const record = {
  session: {
    clientSubmissionId: "test-report-delivery-0001",
    confirmationId: "JS-TEST-DELIVERY",
    questionnaireVersion: "male-health-v1.0",
    submittedAt: "2026-08-13T03:00:00.000Z",
    hasRedFlag: false,
  },
  identity: { name: "虚构用户", age: null, phone: "13800138000", phoneLast4: "8000" },
  healthAnswers: {},
  assessment: { domains: [], hasRedFlag: false, redFlags: [] },
} satisfies PersistedSubmission;

const model = {
  name: "虚构用户",
  confirmationId: "JS-TEST-DELIVERY",
} as HospitalClientReportModel;

describe("hospital client report delivery", () => {
  it("renders, uploads, and sends the PDF in order", async () => {
    const calls: string[] = [];
    const buildModel = vi.fn(() => {
      calls.push("model");
      return model;
    });
    const renderPdf = vi.fn(async () => {
      calls.push("render");
      return Buffer.from("%PDF-test");
    });
    const filename = vi.fn(() => "hospital-report.pdf");
    const upload = vi.fn(async () => {
      calls.push("upload");
      return "MEDIA-ID";
    });
    const send = vi.fn(async () => {
      calls.push("send");
    });

    await expect(deliverHospitalClientReport(record, "hospital-webhook", {
      fontPath: "/fonts/noto.otf",
      buildModel,
      renderPdf,
      filename,
      upload,
      send,
    })).resolves.toBe("sent");

    expect(calls).toEqual(["model", "render", "upload", "send"]);
    expect(renderPdf).toHaveBeenCalledWith(model, "/fonts/noto.otf");
    expect(upload).toHaveBeenCalledWith("hospital-webhook", "hospital-report.pdf", Buffer.from("%PDF-test"));
    expect(send).toHaveBeenCalledWith("hospital-webhook", "MEDIA-ID");
  });

  it("does not render when the hospital webhook is not configured", async () => {
    const renderPdf = vi.fn();

    await expect(deliverHospitalClientReport(record, undefined, {
      fontPath: "/fonts/noto.otf",
      renderPdf,
    })).resolves.toBe("not_configured");
    expect(renderPdf).not.toHaveBeenCalled();
  });

  it("isolates failures and logs only a fixed non-sensitive message", async () => {
    const logError = vi.fn();

    await expect(deliverHospitalClientReport(record, "sensitive-hospital-webhook", {
      fontPath: "/fonts/noto.otf",
      renderPdf: vi.fn(async () => { throw new Error("sensitive upstream response"); }),
      logError,
    })).resolves.toBe("failed");
    expect(logError).toHaveBeenCalledWith("hospital WeCom PDF report delivery failed (render)");
    expect(JSON.stringify(logError.mock.calls)).not.toContain("sensitive-hospital-webhook");
    expect(JSON.stringify(logError.mock.calls)).not.toContain("sensitive upstream response");
  });

  it("logs only the safe WeCom upload code when media delivery is rejected", async () => {
    const logError = vi.fn();

    await expect(deliverHospitalClientReport(record, "sensitive-hospital-webhook", {
      fontPath: "/fonts/noto.otf",
      renderPdf: vi.fn(async () => Buffer.from("%PDF-test")),
      upload: vi.fn(async () => { throw new WeComDeliveryError("企业微信文件上传失败", "api_44001"); }),
      logError,
    })).resolves.toBe("failed");

    expect(logError).toHaveBeenCalledWith("hospital WeCom PDF report delivery failed (upload:api_44001)");
    expect(JSON.stringify(logError.mock.calls)).not.toContain("sensitive-hospital-webhook");
  });
});
