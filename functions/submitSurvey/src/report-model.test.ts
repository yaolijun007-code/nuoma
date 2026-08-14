// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { PersistedSubmission } from "../../../src/domain/submission";
import { buildHospitalClientReportModel } from "./report-model";

const record = (): PersistedSubmission => ({
  session: {
    clientSubmissionId: "test-submission-report-0001",
    confirmationId: "JS-TEST-0001",
    questionnaireVersion: "male-health-v1.0",
    submittedAt: "2026-08-13T03:00:00.000Z",
    hasRedFlag: false,
  },
  identity: { name: "虚构\n用户", age: null, phone: "13800138000", phoneLast4: "8000" },
  healthAnswers: {
    topConcerns: ["0", "1", "4"],
    mainChange: "1",
    singleImprovement: "1",
    workStatus: "0",
    q41: "2",
    q42: "1",
    q43: "2",
    q44: "1",
    q45: "0",
    q46: "2",
    q47: ["0", "2", "4"],
    twelveWeekGoals: ["0", "5", "8"],
    q55: "0",
  },
  assessment: {
    domains: [
      { id: "energy", title: "精力与恢复", level: "evaluate", reasons: ["精力恢复变慢"], recommendation: "建议结合体检进一步评估。" },
      { id: "sleep", title: "睡眠与日间状态", level: "evaluate", reasons: ["存在睡眠相关线索"], recommendation: "建议完成标准化睡眠风险评估。" },
      { id: "mind", title: "压力与认知状态", level: "signal", reasons: ["压力体感出现变化"], recommendation: "建议持续关注睡眠与压力。" },
      ...Array.from({ length: 5 }, (_, index) => ({
        id: `stable-${index}`,
        title: `稳定维度${index + 1}`,
        level: "stable" as const,
        reasons: [],
        recommendation: "当前体感基本稳定。",
      })),
    ],
    hasRedFlag: false,
    redFlags: [],
  },
});

describe("hospital client report model", () => {
  it("maps the hospital submission into readable report sections", () => {
    const report = buildHospitalClientReportModel(record());

    expect(report).toMatchObject({
      institution: "建始民族医院",
      title: "男性健康与功能状态评估报告",
      name: "虚构 用户",
      phone: "13800138000",
      confirmationId: "JS-TEST-0001",
      submittedAt: "2026年08月13日 11:00",
      followUpLabel: "建议重点跟进",
      concerns: ["精力不足", "睡眠", "压力与情绪"],
      mainChange: "睡眠变差",
      primaryGoal: "睡眠",
      statusCounts: { evaluate: 2, signal: 1, stable: 5 },
      safetyNotice: null,
    });
    expect(report.lifestyle).toEqual([
      { label: "职业状态", value: "规律日间工作" },
      { label: "久坐时间", value: "6—8小时" },
      { label: "中等强度运动", value: "3—4天" },
      { label: "力量训练", value: "1次" },
      { label: "饮酒情况", value: "每月1—3次" },
      { label: "吸烟情况", value: "从不吸烟" },
      { label: "晚间进食", value: "有时" },
      { label: "规律摄入食物", value: "蔬菜、全谷物/杂粮、坚果/种子" },
    ]);
    expect(report.twelveWeekGoals).toEqual([
      "更规律地安排睡眠",
      "增加蔬菜、全谷物和豆类",
      "管理工作压力",
    ]);
    expect(report.domains[0]).toMatchObject({
      title: "精力与恢复",
      level: "evaluate",
      levelLabel: "建议进一步评估",
      reason: "精力恢复变慢",
    });
    expect(JSON.stringify(report)).not.toContain("q55");
  });

  it("does not echo unknown option values", () => {
    const input = record();
    input.healthAnswers = {
      ...input.healthAnswers,
      topConcerns: ["0", "unknown", "0"],
      mainChange: "unknown-main-change",
      singleImprovement: "unknown-goal",
      q41: "unknown-lifestyle",
      twelveWeekGoals: ["unknown-twelve-week-goal"],
    };

    const report = buildHospitalClientReportModel(input);

    expect(report.concerns).toEqual(["精力不足"]);
    expect(report.mainChange).toBe("未填写");
    expect(report.primaryGoal).toBe("未填写");
    expect(report.lifestyle.find(({ label }) => label === "久坐时间")?.value).toBe("未填写");
    expect(report.twelveWeekGoals).toEqual([]);
    expect(JSON.stringify(report)).not.toContain("unknown");
  });

  it("replaces all detailed red-flag content with one clinical safety notice", () => {
    const input = record();
    input.session.hasRedFlag = true;
    input.healthAnswers.q55 = "1";
    input.assessment = {
      hasRedFlag: true,
      redFlags: ["伤害自己的想法"],
      domains: input.assessment.domains.map((domain) => ({
        ...domain,
        level: "clinical_priority",
        reasons: ["医学安全信息需要医务人员优先核实"],
        recommendation: "具体敏感干预内容不应进入群文件",
      })),
    };

    const report = buildHospitalClientReportModel(input);
    const serialized = JSON.stringify(report);

    expect(report.followUpLabel).toBe("需医务人员优先核实");
    expect(report.safetyNotice).toBe("医学安全信息需要医务人员优先核实，请先完成风险判断，再决定健康管理路径。");
    expect(report.domains.every(({ reason }) => reason === "安全信息待人工核实")).toBe(true);
    expect(report.domains.every(({ recommendation }) => recommendation === "请由医务人员先完成信息核实与风险判断。")).toBe(true);
    expect(serialized).not.toContain("伤害自己的想法");
    expect(serialized).not.toContain("具体敏感干预内容");
    expect(serialized).not.toContain("q55");
  });
});
