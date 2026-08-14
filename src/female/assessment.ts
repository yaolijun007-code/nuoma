import type { AnswerMap, AssessmentDomain, AssessmentLevel, AssessmentResult } from "../domain/types";
import { findFemaleQuestion, type FemaleSignal } from "./surveyDefinition";

export interface FemaleAssessmentResult extends AssessmentResult {
  screeningAttention: string[];
}

interface DomainDefinition {
  id: string;
  title: string;
  questionIds: string[];
  recommendation: string;
}

const domains: DomainDefinition[] = [
  { id: "femaleLifecycle", title: "女性生命周期", questionIds: ["f5", "f6", "f7", "f8", "f9", "f10", "f11"], recommendation: "建议结合生命周期阶段和实际体感，由医务人员判断是否需要女性激素或妇科方向评估。" },
  { id: "sleep", title: "睡眠状态", questionIds: ["f12", "f13", "f14", "f15", "f25"], recommendation: "建议进一步了解睡眠时长、睡眠质量及睡眠呼吸相关风险。" },
  { id: "mind", title: "情绪与认知", questionIds: ["f16", "f17", "f18", "f19"], recommendation: "建议结合睡眠、压力与生活影响程度，进一步完成情绪和认知状态评估。" },
  { id: "metabolicCardio", title: "代谢与心血管体感", questionIds: ["f20", "f21", "f22", "f23", "f24", "f26", "f48"], recommendation: "建议结合血压、血糖、血脂、体成分及心血管风险因素进一步评估。" },
  { id: "musculoskeletal", title: "骨骼、肌肉与功能储备", questionIds: ["f27", "f28", "f29", "f30", "f46"], recommendation: "建议结合骨密度、肌肉量、握力和基础运动能力进一步评估。" },
  { id: "breastGynecology", title: "乳腺与妇科健康线索", questionIds: ["f31", "f32", "f33"], recommendation: "建议结合症状、既往资料及医务人员判断安排乳腺或妇科专项评估。" },
  { id: "urogenital", title: "泌尿生殖状态", questionIds: ["f34", "f35", "f36", "f37", "f38"], recommendation: "建议进一步了解泌尿生殖体感及其对日常生活的影响。" },
  { id: "gutLifestyle", title: "胃肠、微生态与生活方式", questionIds: ["f41", "f42", "f43", "f44", "f45", "f47"], recommendation: "建议结合排便、饮食、用药及生活方式线索进一步评估；问卷不判断菌群状态。" },
];

function selectedSignals(answers: AnswerMap, questionId: string): FemaleSignal[] {
  const question = findFemaleQuestion(questionId);
  const value = answers[questionId];
  if (!question || value === undefined || value === null || value === "__skip__") return [];
  if (Array.isArray(value)) return value.map((item) => question.signalBySelectedValue?.[item] ?? "none");
  return [question.signalByValue?.[String(value)] ?? "none"];
}

function levelFromSignals(signals: FemaleSignal[]): AssessmentLevel {
  const relevant = signals.filter((item) => item !== "none");
  if (relevant.includes("safety")) return "clinical_priority";
  if (relevant.some((item) => item === "moderate" || item === "marked")) return "evaluate";
  return relevant.filter((item) => item === "mild").length >= 2 ? "evaluate" : relevant.length === 1 ? "signal" : "stable";
}

function reasonForLevel(level: AssessmentLevel) {
  if (level === "evaluate") return "相关体感出现较明确变化，建议结合客观资料进一步评估";
  if (level === "signal") return "相关体感存在轻微变化信号";
  return "当前相关体感基本稳定";
}

function screeningAttention(answers: AnswerMap) {
  const attention: string[] = [];
  if (["3", "4", "6"].includes(String(answers.f39 ?? ""))) attention.push("宫颈筛查安排可与医务人员进一步确认");
  if (["2", "3", "4"].includes(String(answers.f40 ?? ""))) attention.push("乳腺影像检查安排可与医务人员进一步确认");
  if (["2", "3", "4", "5"].includes(String(answers.f52 ?? ""))) attention.push("结直肠筛查安排可与医务人员进一步确认");
  return attention;
}

export function assessFemaleSurvey(answers: AnswerMap): FemaleAssessmentResult {
  const redFlags = Array.from(new Set(
    domains.flatMap((definition) => definition.questionIds.filter((id) => selectedSignals(answers, id).includes("safety"))),
  ));

  let assessedDomains: AssessmentDomain[] = domains.map((definition) => {
    const signals = definition.questionIds.flatMap((id) => selectedSignals(answers, id));
    const level = levelFromSignals(signals);
    return {
      id: definition.id,
      title: definition.title,
      level,
      reasons: [reasonForLevel(level)],
      recommendation: level === "stable" ? "建议保持当前有利习惯，并结合后续体检持续观察变化。" : definition.recommendation,
    };
  });

  if (redFlags.length) {
    assessedDomains = assessedDomains.map((item) => ({
      ...item,
      level: "clinical_priority",
      reasons: ["医学安全信息需要医务人员优先核实"],
      recommendation: "请先由医务人员完成信息核实与风险判断，再决定后续健康管理路径。",
    }));
  }

  return {
    domains: assessedDomains,
    hasRedFlag: redFlags.length > 0,
    redFlags,
    screeningAttention: screeningAttention(answers),
  };
}
