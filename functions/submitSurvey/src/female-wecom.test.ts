// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { PersistedSubmission } from "../../../src/domain/submission";
import { buildFemaleWeComMarkdown } from "./wecom";

const record = (hasRedFlag = false): PersistedSubmission => ({
  session: {
    clientSubmissionId: "female-wecom-test-0001",
    confirmationId: "JS-FEMALE-TEST",
    questionnaireVersion: "female-health-v1.0",
    submittedAt: "2026-08-14T03:26:00.000Z",
    hasRedFlag,
  },
  identity: { name: "李女士", age: 52, phone: "13800138000", phoneLast4: "8000" },
  healthAnswers: { f5: "4", f53: ["0", "1", "4"], f55: 8 },
  assessment: {
    domains: [
      { id: "sleep", title: "睡眠状态", level: "evaluate", reasons: [], recommendation: "" },
      { id: "mind", title: "情绪与认知", level: "signal", reasons: [], recommendation: "" },
      { id: "gutLifestyle", title: "胃肠、微生态与生活方式", level: "stable", reasons: [], recommendation: "" },
    ],
    hasRedFlag,
    redFlags: hasRedFlag ? ["f24"] : [],
  },
});

describe("female WeCom markdown", () => {
  it("includes known-option highlights and visual status counts", () => {
    const markdown = buildFemaleWeComMarkdown(record());
    expect(markdown).toContain("### 🌺 建始民族医院｜女性健康问卷");
    expect(markdown).toContain("李女士");
    expect(markdown).toContain("13800138000");
    expect(markdown).toContain("女性激素与围绝经期变化");
    expect(markdown).toContain("已连续12个月以上没有月经");
    expect(markdown).toContain("8 / 10");
    expect(markdown).toContain("评估 1");
    expect(markdown).not.toContain("f24");
  });

  it("shows only a generic safety message", () => {
    const markdown = buildFemaleWeComMarkdown(record(true));
    expect(markdown).toContain("需医务人员优先核实");
    expect(markdown).not.toContain("胸痛");
    expect(markdown).not.toContain("f24");
  });
});
