import type { PersistedSubmission } from "../../../src/domain/submission";
import type { AssessmentLevel } from "../../../src/domain/types";
import type { FemaleAssessmentResult } from "../../../src/female/assessment";
import { findFemaleQuestion } from "../../../src/female/surveyDefinition";

export interface FemaleClientReportModel {
  institution: "建始民族医院";
  title: "女性健康与功能状态评估报告";
  name: string;
  phone: string;
  ageLabel: string;
  confirmationId: string;
  submittedAt: string;
  followUpLabel: string;
  lifecycle: string;
  concerns: string[];
  healthRating: number | null;
  statusCounts: { clinicalPriority: number; evaluate: number; signal: number; stable: number };
  domains: Array<{ title: string; level: AssessmentLevel; levelLabel: string; reason: string; recommendation: string }>;
  screenings: Array<{ label: string; value: string; attention: boolean }>;
  lifestyle: Array<{ label: string; value: string }>;
  healthContext: Array<{ label: string; value: string }>;
  safetyNotice: string | null;
}

const levelLabels: Record<AssessmentLevel, string> = {
  clinical_priority: "优先临床核实",
  evaluate: "建议进一步评估",
  signal: "存在变化信号",
  stable: "基本稳定",
};

function labels(id: string) {
  return new Map(findFemaleQuestion(id)?.options?.map((option) => [option.value, option.label]) ?? []);
}

function safeText(value: unknown, fallback = "未填写", maxLength = 160) {
  const text = String(value ?? "").replace(/[\u0000-\u001f\u007f<>`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
  return text || fallback;
}

function single(record: PersistedSubmission, id: string) {
  return labels(id).get(String(record.healthAnswers[id] ?? "")) ?? "未填写";
}

function multi(record: PersistedSubmission, id: string) {
  const answer = record.healthAnswers[id];
  if (!Array.isArray(answer)) return [];
  const map = labels(id);
  return [...new Set(answer.map(String))].map((value) => map.get(value)).filter((value): value is string => Boolean(value)).map((value) => safeText(value));
}

function submittedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待核实";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}年${parts.month}月${parts.day}日 ${parts.hour}:${parts.minute}`;
}

function followUp(record: PersistedSubmission) {
  if (record.session.hasRedFlag || record.assessment.hasRedFlag) return "需医务人员优先核实";
  const evaluate = record.assessment.domains.filter((domain) => domain.level === "evaluate").length;
  const signal = record.assessment.domains.filter((domain) => domain.level === "signal").length;
  if (evaluate >= 2) return "建议重点跟进";
  if (evaluate + signal > 0) return "存在变化信号";
  return "常规健康管理";
}

export function buildFemaleClientReportModel(record: PersistedSubmission): FemaleClientReportModel {
  const hasRedFlag = record.session.hasRedFlag || record.assessment.hasRedFlag;
  const displayedLevels = record.assessment.domains.map((domain) => hasRedFlag ? "clinical_priority" : domain.level);
  const counts = (level: AssessmentLevel) => displayedLevels.filter((item) => item === level).length;
  const assessment = record.assessment as FemaleAssessmentResult;
  const attention = new Set(assessment.screeningAttention ?? []);
  const healthScore = Number(record.healthAnswers.f55);

  return {
    institution: "建始民族医院",
    title: "女性健康与功能状态评估报告",
    name: safeText(record.identity.name, "未填写", 80),
    phone: /^1\d{10}$/.test(record.identity.phone ?? "") ? record.identity.phone! : "未提供",
    ageLabel: single(record, "f4"),
    confirmationId: safeText(record.session.confirmationId, "记录编号待核实", 80),
    submittedAt: submittedAt(record.session.submittedAt),
    followUpLabel: followUp(record),
    lifecycle: single(record, "f5"),
    concerns: multi(record, "f53").slice(0, 3),
    healthRating: Number.isInteger(healthScore) && healthScore >= 0 && healthScore <= 10 ? healthScore : null,
    statusCounts: { clinicalPriority: counts("clinical_priority"), evaluate: counts("evaluate"), signal: counts("signal"), stable: counts("stable") },
    domains: record.assessment.domains.slice(0, 8).map((domain) => ({
      title: safeText(domain.title, "未命名方向", 40),
      level: hasRedFlag ? "clinical_priority" : domain.level,
      levelLabel: levelLabels[hasRedFlag ? "clinical_priority" : domain.level],
      reason: hasRedFlag ? "医学安全信息需要医务人员优先核实" : safeText(domain.reasons[0], "当前相关体感基本稳定", 100),
      recommendation: hasRedFlag ? "请先由医务人员完成信息核实与风险判断。" : safeText(domain.recommendation, "建议保持当前有利习惯并持续观察变化。", 180),
    })),
    screenings: [
      { label: "宫颈筛查", value: single(record, "f39"), attention: attention.has("宫颈筛查安排可与医务人员进一步确认") },
      { label: "乳腺影像", value: single(record, "f40"), attention: attention.has("乳腺影像检查安排可与医务人员进一步确认") },
      { label: "结直肠筛查", value: single(record, "f52"), attention: attention.has("结直肠筛查安排可与医务人员进一步确认") },
    ],
    lifestyle: [
      { label: "运动状态", value: single(record, "f46") },
      { label: "饮食结构", value: multi(record, "f47").join("、") || "未填写" },
      { label: "吸烟与饮酒", value: multi(record, "f48").join("、") || "未填写" },
      { label: "近3个月用药", value: multi(record, "f45").join("、") || "未填写" },
    ],
    healthContext: [
      { label: "既往健康", value: multi(record, "f49").join("、") || "未填写" },
      { label: "长期使用", value: multi(record, "f50").join("、") || "未填写" },
      { label: "家族健康", value: multi(record, "f51").join("、") || "未填写" },
    ],
    safetyNotice: hasRedFlag ? "医学安全信息需要医务人员优先核实，请先完成风险判断，再决定健康管理路径。" : null,
  };
}
