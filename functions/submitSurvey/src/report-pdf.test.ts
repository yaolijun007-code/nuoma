// @vitest-environment node
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { HospitalClientReportModel } from "./report-model";
import { hospitalClientReportFilename, renderHospitalClientReportPdf } from "./report-pdf";

const fontPath = fileURLToPath(new URL("../assets/NotoSansCJKsc-Regular.otf", import.meta.url));

const model: HospitalClientReportModel = {
  institution: "建始民族医院",
  title: "男性健康与功能状态评估报告",
  name: "虚构用户",
  phone: "13800138000",
  confirmationId: "JS-TEST-0001",
  submittedAt: "2026年08月13日 11:00",
  followUpLabel: "建议重点跟进",
  concerns: ["精力不足", "睡眠", "压力与情绪"],
  mainChange: "睡眠变差",
  primaryGoal: "睡眠",
  statusCounts: { evaluate: 2, signal: 1, stable: 5 },
  domains: [
    { title: "精力与恢复", level: "evaluate", levelLabel: "建议进一步评估", reason: "精力恢复变慢", recommendation: "建议结合体检进一步评估。" },
    { title: "睡眠与日间状态", level: "evaluate", levelLabel: "建议进一步评估", reason: "存在睡眠相关线索", recommendation: "建议完成标准化睡眠风险评估。" },
    { title: "压力与认知状态", level: "signal", levelLabel: "存在变化信号", reason: "压力体感出现变化", recommendation: "建议持续关注睡眠与压力。" },
    ...Array.from({ length: 5 }, (_, index) => ({
      title: `稳定维度${index + 1}`,
      level: "stable" as const,
      levelLabel: "基本稳定",
      reason: "当前未发现明显变化信号",
      recommendation: "建议保持当前习惯并持续观察变化。",
    })),
  ],
  lifestyle: [
    { label: "职业状态", value: "规律日间工作" },
    { label: "久坐时间", value: "6—8小时" },
    { label: "中等强度运动", value: "3—4天" },
    { label: "力量训练", value: "1次" },
    { label: "饮酒情况", value: "每月1—3次" },
    { label: "吸烟情况", value: "从不吸烟" },
    { label: "晚间进食", value: "有时" },
    { label: "规律摄入食物", value: "蔬菜、全谷物/杂粮、坚果/种子" },
  ],
  twelveWeekGoals: ["更规律地安排睡眠", "增加蔬菜、全谷物和豆类", "管理工作压力"],
  safetyNotice: null,
};

describe("hospital client report PDF", () => {
  it("renders an A4 report with exactly three pages", async () => {
    const pdf = await renderHospitalClientReportPdf(model, fontPath);

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)).toHaveLength(3);
    expect(pdf.length).toBeGreaterThan(20_000);
  });

  it("builds a readable and filesystem-safe filename", () => {
    expect(hospitalClientReportFilename(model)).toBe("建始民族医院_健康评估报告_虚构用户_JS-TEST-0001.pdf");
    expect(hospitalClientReportFilename({
      name: "张/三\\..\n含很长很长很长很长很长很长很长很长很长很长的姓名",
      confirmationId: "JS-TEST/../../SECRET",
    })).toBe("建始民族医院_健康评估报告_张三..含很长很长很长很长很长很长很长很长很长很_JS-TEST....SECRET.pdf");
  });
});
