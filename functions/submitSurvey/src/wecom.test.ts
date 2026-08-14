// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { PersistedSubmission } from "../../../src/domain/submission";
import { buildNuomaYuanyiWeComMarkdown, buildWeComMarkdown, sendWeComNotification } from "./wecom";

const record: PersistedSubmission = {
  session: {
    clientSubmissionId: "test-submission-0001",
    confirmationId: "JS-TEST-0001",
    questionnaireVersion: "male-health-v1.0",
    submittedAt: "2026-08-13T03:00:00.000Z",
    hasRedFlag: false,
  },
  identity: { name: "虚构\n用户", age: null, phone: "13800138000", phoneLast4: "8000" },
  healthAnswers: { q55: "0", q1: "3", topConcerns: ["0", "1", "4"], mainChange: "1", singleImprovement: "1" },
  assessment: {
    domains: [
      { id: "energy", title: "精力与恢复", level: "evaluate", reasons: [], recommendation: "" },
      { id: "sleep", title: "睡眠与日间状态", level: "evaluate", reasons: [], recommendation: "" },
      { id: "mind", title: "压力与认知状态", level: "signal", reasons: [], recommendation: "" },
      ...Array.from({ length: 5 }, (_, index) => ({ id: `stable-${index}`, title: `稳定${index}`, level: "stable" as const, reasons: [], recommendation: "" })),
    ],
    hasRedFlag: false,
    redFlags: [],
  },
};

describe("hospital WeCom notification", () => {
  it("renders the complete visual follow-up message", () => {
    const markdown = buildWeComMarkdown(record);
    expect(markdown).toBe([
      "### 🏥 建始民族医院｜新健康问卷",
      "",
      "🚦 **跟进等级**：<font color=\"warning\">建议重点跟进</font>",
      "",
      "👤 **姓名**：虚构 用户",
      "📱 **手机号**：13800138000",
      "🎯 **主要问题**：① 精力不足　② 睡眠　③ 压力与情绪",
      "🔎 **最明显变化**：睡眠变差",
      "⭐ **首要改善目标**：睡眠",
      "",
      "📊 **状态概览**：<font color=\"warning\">评估 2</font>｜<font color=\"comment\">变化 1</font>｜<font color=\"info\">稳定 5</font>",
      "",
      "🕒 **提交时间**：08月13日 11:00",
      "🧾 **记录编号**：JS-TEST-0001",
    ].join("\n"));
    expect(markdown).not.toContain("q55");
  });

  it("renders red-flag, signal, and stable follow-up levels without raw safety answers", () => {
    const redFlag = buildWeComMarkdown({
      ...record,
      session: { ...record.session, hasRedFlag: true },
      healthAnswers: { ...record.healthAnswers, q55: "1" },
      assessment: { ...record.assessment, hasRedFlag: true, redFlags: ["测试风险"] },
    });
    expect(redFlag).toContain('<font color="warning">需医务人员优先核实</font>');
    expect(redFlag).toContain('<font color="warning">安全信息待人工核实</font>');
    expect(redFlag).not.toContain("测试风险");
    expect(redFlag).not.toContain("q55");

    const signal = buildWeComMarkdown({
      ...record,
      assessment: { ...record.assessment, domains: record.assessment.domains.map((domain, index) => ({ ...domain, level: index === 0 ? "signal" as const : "stable" as const })) },
    });
    expect(signal).toContain('<font color="comment">存在变化信号</font>');

    const stable = buildWeComMarkdown({
      ...record,
      assessment: { ...record.assessment, domains: record.assessment.domains.map((domain) => ({ ...domain, level: "stable" as const })) },
    });
    expect(stable).toContain('<font color="info">常规健康管理</font>');
  });

  it("de-duplicates concerns and safely degrades unknown or invalid values", () => {
    const markdown = buildWeComMarkdown({
      ...record,
      session: { ...record.session, submittedAt: "invalid" },
      identity: { ...record.identity, phone: "invalid" },
      healthAnswers: { ...record.healthAnswers, topConcerns: ["0", "unknown", "0"], mainChange: "unknown", singleImprovement: "unknown" },
    });

    expect(markdown).toContain("📱 **手机号**：未提供");
    expect(markdown).toContain("🎯 **主要问题**：① 精力不足");
    expect(markdown).toContain("🔎 **最明显变化**：未填写");
    expect(markdown).toContain("⭐ **首要改善目标**：未填写");
    expect(markdown).toContain("🕒 **提交时间**：时间待核实");
    expect(markdown).not.toContain("unknown");
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

describe("Nuoma Yuanyi WeCom summary", () => {
  it("summarizes assessment directions and goals without exposing identity or raw answers", () => {
    const nuomaRecord: PersistedSubmission = {
      ...record,
      session: {
        ...record.session,
        questionnaireVersion: "nuoma-yuanyi-male-health-v1.0",
        hasRedFlag: false,
      },
      healthAnswers: {
        q1: "4",
        q55: "0",
        twelveWeekGoals: ["0", "5", "8"],
        mainChange: "不应出现在群里的开放文本",
        singleImprovement: "不应出现在群里的健康目标原文",
      },
      assessment: {
        hasRedFlag: false,
        redFlags: ["不应展示的具体红旗"],
        domains: [
          { id: "energy", title: "精力与恢复", level: "evaluate", reasons: ["敏感原因"], recommendation: "敏感建议" },
          { id: "sleep", title: "睡眠与日间状态", level: "signal", reasons: [], recommendation: "敏感建议" },
          { id: "mind", title: "压力与认知状态", level: "stable", reasons: [], recommendation: "敏感建议" },
        ],
      },
    };

    const markdown = buildNuomaYuanyiWeComMarkdown(nuomaRecord);

    expect(markdown).toContain("诺玛元一｜新问卷概要");
    expect(markdown).toContain("JS-TEST-0001");
    expect(markdown).toContain("精力与恢复");
    expect(markdown).toContain("睡眠与日间状态");
    expect(markdown).toContain("改善睡眠、增加运动、改善饮食结构");
    expect(markdown).toContain("未发现医学安全红旗");
    expect(markdown).not.toContain("测试客户");
    expect(markdown).not.toContain("138");
    expect(markdown).not.toContain("不应出现在群里的开放文本");
    expect(markdown).not.toContain("不应出现在群里的健康目标原文");
    expect(markdown).not.toContain("不应展示的具体红旗");
    expect(markdown).not.toContain("敏感原因");
    expect(markdown).not.toContain("q55");
  });

  it("shows a clinical follow-up status without listing the red-flag answers", () => {
    const markdown = buildNuomaYuanyiWeComMarkdown({
      ...record,
      session: { ...record.session, questionnaireVersion: "nuoma-yuanyi-male-health-v1.0", hasRedFlag: true },
      assessment: { ...record.assessment, hasRedFlag: true, redFlags: ["测试风险"] },
    });

    expect(markdown).toContain("存在医学安全红旗，需优先人工核实");
    expect(markdown).not.toContain("测试风险");
  });
});
