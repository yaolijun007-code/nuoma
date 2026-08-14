import type { PersistedSubmission } from "../../../src/domain/submission";
import type { AssessmentLevel } from "../../../src/domain/types";
import { findHospitalQuestion } from "../../../src/hospital/surveyDefinition";

export type ClientReportLevel = AssessmentLevel;

export interface HospitalClientReportModel {
  institution: "建始民族医院";
  title: "男性健康与功能状态评估报告";
  name: string;
  phone: string;
  confirmationId: string;
  submittedAt: string;
  followUpLabel: string;
  concerns: string[];
  mainChange: string;
  primaryGoal: string;
  statusCounts: { evaluate: number; signal: number; stable: number };
  domains: Array<{
    title: string;
    level: ClientReportLevel;
    levelLabel: string;
    reason: string;
    recommendation: string;
  }>;
  lifestyle: Array<{ label: string; value: string }>;
  twelveWeekGoals: string[];
  safetyNotice: string | null;
}

const levelLabels: Record<ClientReportLevel, string> = {
  clinical_priority: "优先临床核实",
  evaluate: "建议进一步评估",
  signal: "存在变化信号",
  stable: "基本稳定",
};

const questionLabels = (id: string) => new Map(
  findHospitalQuestion(id)?.options?.map((option) => [option.value, option.label]) ?? [],
);

const topConcernLabels = questionLabels("topConcerns");
const mainChangeLabels = questionLabels("mainChange");
const twelveWeekGoalLabels = questionLabels("twelveWeekGoals");

function safeText(value: unknown, fallback = "未填写", maxLength = 160) {
  const text = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f<>`\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return text || fallback;
}

function mappedAnswer(record: PersistedSubmission, id: string) {
  return questionLabels(id).get(String(record.healthAnswers[id] ?? "")) ?? "未填写";
}

function mappedMulti(record: PersistedSubmission, id: string, labels = questionLabels(id)) {
  const value = record.healthAnswers[id];
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String))]
    .map((item) => labels.get(item))
    .filter((item): item is string => Boolean(item))
    .map((item) => safeText(item));
}

function formattedSubmittedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待核实";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}年${parts.month}月${parts.day}日 ${parts.hour}:${parts.minute}`;
}

function followUpLabel(record: PersistedSubmission) {
  if (record.session.hasRedFlag) return "需医务人员优先核实";
  const evaluate = record.assessment.domains.filter(({ level }) => level === "evaluate").length;
  const signal = record.assessment.domains.filter(({ level }) => level === "signal").length;
  if (evaluate >= 2) return "建议重点跟进";
  if (evaluate + signal > 0) return "存在变化信号";
  return "常规健康管理";
}

function primaryGoal(record: PersistedSubmission) {
  const selected = record.healthAnswers.topConcerns;
  const goal = String(record.healthAnswers.singleImprovement ?? "");
  if (!Array.isArray(selected) || !selected.map(String).includes(goal)) return "未填写";
  return topConcernLabels.get(goal) ?? "未填写";
}

export function buildHospitalClientReportModel(record: PersistedSubmission): HospitalClientReportModel {
  const hasRedFlag = record.session.hasRedFlag || record.assessment.hasRedFlag;
  const counts = (level: "evaluate" | "signal" | "stable") =>
    record.assessment.domains.filter((domain) => domain.level === level).length;

  const lifestyle: HospitalClientReportModel["lifestyle"] = [
    { label: "职业状态", value: mappedAnswer(record, "workStatus") },
    { label: "久坐时间", value: mappedAnswer(record, "q41") },
    { label: "中等强度运动", value: mappedAnswer(record, "q42") },
    { label: "力量训练", value: mappedAnswer(record, "q43") },
    { label: "饮酒情况", value: mappedAnswer(record, "q44") },
    { label: "吸烟情况", value: mappedAnswer(record, "q45") },
    { label: "晚间进食", value: mappedAnswer(record, "q46") },
    { label: "规律摄入食物", value: mappedMulti(record, "q47").join("、") || "未填写" },
  ];

  return {
    institution: "建始民族医院",
    title: "男性健康与功能状态评估报告",
    name: safeText(record.identity.name, "未填写", 80),
    phone: /^1\d{10}$/.test(record.identity.phone ?? "") ? record.identity.phone! : "未提供",
    confirmationId: safeText(record.session.confirmationId, "记录编号待核实", 80),
    submittedAt: formattedSubmittedAt(record.session.submittedAt),
    followUpLabel: followUpLabel(record),
    concerns: mappedMulti(record, "topConcerns", topConcernLabels).slice(0, 3),
    mainChange: mainChangeLabels.get(String(record.healthAnswers.mainChange ?? "")) ?? "未填写",
    primaryGoal: primaryGoal(record),
    statusCounts: { evaluate: counts("evaluate"), signal: counts("signal"), stable: counts("stable") },
    domains: record.assessment.domains.slice(0, 8).map((domain) => ({
      title: safeText(domain.title, "未命名维度", 40),
      level: hasRedFlag ? "clinical_priority" : domain.level,
      levelLabel: levelLabels[hasRedFlag ? "clinical_priority" : domain.level],
      reason: hasRedFlag ? "安全信息待人工核实" : safeText(domain.reasons[0], "当前未发现明显变化信号", 100),
      recommendation: hasRedFlag
        ? "请由医务人员先完成信息核实与风险判断。"
        : safeText(domain.recommendation, "建议保持当前习惯并持续观察变化。", 180),
    })),
    lifestyle,
    twelveWeekGoals: mappedMulti(record, "twelveWeekGoals", twelveWeekGoalLabels).slice(0, 3),
    safetyNotice: hasRedFlag
      ? "医学安全信息需要医务人员优先核实，请先完成风险判断，再决定健康管理路径。"
      : null,
  };
}
