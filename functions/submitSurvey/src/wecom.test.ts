// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { PersistedSubmission } from "../../../src/domain/submission";
import { buildWeComMarkdown, sendWeComNotification } from "./wecom";

const record: PersistedSubmission = {
  session: {
    clientSubmissionId: "test-submission-0001",
    confirmationId: "JS-TEST-0001",
    questionnaireVersion: "male-health-v1.0",
    submittedAt: "2026-08-13T03:00:00.000Z",
    hasRedFlag: true,
  },
  identity: { name: "测试客户", age: null, phone: "13800138000", phoneLast4: "8000" },
  healthAnswers: { q55: "1", q1: "3" },
  assessment: { domains: [], hasRedFlag: true, redFlags: ["测试风险"] },
};

describe("hospital WeCom notification", () => {
  it("contains only operational details and masks the full phone", () => {
    const markdown = buildWeComMarkdown(record);
    expect(markdown).toContain("建始民族医院｜新健康问卷");
    expect(markdown).toContain("测试客户");
    expect(markdown).toContain("138****8000");
    expect(markdown).toContain("建议优先人工确认");
    expect(markdown).not.toContain("13800138000");
    expect(markdown).not.toContain("测试风险");
    expect(markdown).not.toContain("q55");
  });

  it("accepts only the official WeCom robot webhook host and path", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ errcode: 0 }), { status: 200 }));
    await expect(sendWeComNotification("https://example.com/cgi-bin/webhook/send?key=secret", "message", fetcher)).rejects.toThrow("企业微信通知地址无效");
    await expect(sendWeComNotification("https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=test-key", "message", fetcher)).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns a generic error without exposing webhook details", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ errcode: 93000 }), { status: 200 }));
    const promise = sendWeComNotification("https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=sensitive-secret", "message", fetcher);
    await expect(promise).rejects.toThrow("企业微信通知失败");
    await expect(promise).rejects.not.toThrow("sensitive-secret");
  });
});
