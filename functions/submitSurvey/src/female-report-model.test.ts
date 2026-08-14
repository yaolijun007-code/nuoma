// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { PersistedSubmission } from "../../../src/domain/submission";
import { buildFemaleClientReportModel } from "./female-report-model";

const record = (): PersistedSubmission => ({
  session: { clientSubmissionId: "female-report-test-0001", confirmationId: "JS-FEMALE-TEST", questionnaireVersion: "female-health-v1.0", submittedAt: "2026-08-14T03:26:00.000Z", hasRedFlag: false },
  identity: { name: "李\n女士", age: 52, phone: "13800138000", phoneLast4: "8000" },
  healthAnswers: {
    f4: "2", f5: "4", f39: "4", f40: "3", f45: ["0"], f46: "2", f47: ["0", "1", "5"], f48: ["0", "4"],
    f49: ["2"], f50: ["9"], f51: ["4"], f52: "4", f53: ["0", "1", "4"], f55: 8,
  },
  assessment: {
    domains: [
      { id: "femaleLifecycle", title: "女性生命周期", level: "evaluate", reasons: ["相关体感出现较明确变化"], recommendation: "建议进一步评估。" },
      { id: "sleep", title: "睡眠状态", level: "signal", reasons: ["存在轻微变化"], recommendation: "建议持续观察。" },
      ...Array.from({ length: 6 }, (_, index) => ({ id: `stable-${index}`, title: `稳定方向${index + 1}`, level: "stable" as const, reasons: ["基本稳定"], recommendation: "保持当前习惯。" })),
    ],
    hasRedFlag: false,
    redFlags: [],
    screeningAttention: ["宫颈筛查安排可与医务人员进一步确认", "乳腺影像检查安排可与医务人员进一步确认", "结直肠筛查安排可与医务人员进一步确认"],
  } as PersistedSubmission["assessment"],
});

describe("female client report model", () => {
  it("maps known options into a safe women health report", () => {
    const model = buildFemaleClientReportModel(record());
    expect(model).toMatchObject({
      title: "女性健康与功能状态评估报告",
      name: "李 女士",
      phone: "13800138000",
      ageLabel: "50—54岁",
      lifecycle: "已连续12个月以上没有月经",
      healthRating: 8,
      concerns: ["女性激素与围绝经期变化", "睡眠", "体重与腰腹脂肪"],
      statusCounts: { clinicalPriority: 0, evaluate: 1, signal: 1, stable: 6 },
    });
    expect(model.screenings).toHaveLength(3);
    expect(model.lifestyle.find((item) => item.label === "运动状态")?.value).toContain("每周运动1—2次");
    expect(JSON.stringify(model)).not.toContain("f39");
  });

  it("replaces detailed red flags with one generic clinical notice", () => {
    const input = record();
    input.session.hasRedFlag = true;
    input.assessment.hasRedFlag = true;
    input.assessment.redFlags = ["f24"];
    const model = buildFemaleClientReportModel(input);
    expect(model.safetyNotice).toContain("医务人员优先核实");
    expect(model.domains.every((domain) => domain.level === "clinical_priority")).toBe(true);
    expect(model.statusCounts).toEqual({ clinicalPriority: 8, evaluate: 0, signal: 0, stable: 0 });
    expect(JSON.stringify(model)).not.toContain("f24");
  });
});
