import type { AnswerMap, AssessmentDomain, AssessmentLevel, AssessmentResult } from "./types";

const score = (answers: AnswerMap, id: string) => Number(answers[id] ?? 0);
const high = (answers: AnswerMap, id: string) => score(answers, id) >= 3;
const highCount = (answers: AnswerMap, ids: string[]) => ids.filter((id) => high(answers, id)).length;

const levelFromCount = (count: number): AssessmentLevel => count >= 2 ? "evaluate" : count === 1 ? "signal" : "stable";

const copy = {
  stable: "当前体感基本稳定，建议保持并持续观察变化。",
  signal: "当前存在变化信号，建议结合体检资料持续关注。",
  evaluate: "存在进一步评估线索，建议与健康管理师共同确认优先方向。",
};

function domain(
  id: string,
  title: string,
  level: AssessmentLevel,
  reasons: string[],
  recommendation = copy[level as keyof typeof copy] ?? copy.evaluate,
): AssessmentDomain {
  return { id, title, level, reasons, recommendation };
}

export function assessSurvey(answers: AnswerMap): AssessmentResult {
  const redFlags = Array.from({ length: 7 }, (_, index) => `q${49 + index}`)
    .filter((id) => score(answers, id) === 1);

  const energyCount = highCount(answers, ["q2", "q4", "q5", "q6", "q7", "q8"]);
  const sleepScreen = score(answers, "q12") >= 2 || high(answers, "q13") || (score(answers, "q9") <= 1 && high(answers, "q4"));
  const mindCount = highCount(answers, ["q15", "q16", "q17", "q18", "q19"]);

  const bowelAbnormal = score(answers, "q20") >= 3 || high(answers, "q21") || high(answers, "q22");
  const gutCombination = (bowelAbnormal && high(answers, "q23"))
    || (bowelAbnormal && score(answers, "q25") >= 3)
    || (high(answers, "q23") && score(answers, "q25") >= 3)
    || (Array.isArray(answers.q48) && answers.q48.includes("0") && highCount(answers, ["q21", "q22", "q23", "q24"]) >= 1);
  const gutSignalCount = highCount(answers, ["q20", "q21", "q22", "q23", "q24", "q25"]);

  const metabolicSignals = ["q26", "q27", "q28", "q29", "q41", "q44", "q46"].filter((id) => high(answers, id));
  const cardioCount = highCount(answers, ["q30", "q31"]);
  const muscleCount = highCount(answers, ["q30", "q32", "q33", "q34", "q42"]);

  const maleDeclines = highCount(answers, ["q35", "q36", "q37"]);
  const reserveDecline = highCount(answers, ["q5", "q32", "q33"]) >= 1;
  const urologyTrigger = score(answers, "q38") >= 2 || high(answers, "q39") || high(answers, "q40");
  const maleEvaluate = urologyTrigger || (maleDeclines >= 2 && reserveDecline);

  let domains: AssessmentDomain[] = [
    domain("energy", "精力与恢复", levelFromCount(energyCount), energyCount ? ["精力或恢复体感较既往出现变化"] : []),
    domain(
      "sleep",
      "睡眠与日间状态",
      sleepScreen ? "evaluate" : levelFromCount(highCount(answers, ["q9", "q10", "q11", "q13", "q14"])),
      sleepScreen ? ["存在睡眠质量或睡眠呼吸相关线索"] : [],
      sleepScreen ? "存在睡眠质量或睡眠呼吸相关线索，建议进一步完成标准化睡眠风险评估；必要时进入睡眠医学评估。" : undefined,
    ),
    domain("mind", "压力与认知状态", mindCount >= 2 ? "evaluate" : levelFromCount(mindCount), mindCount ? ["压力、情绪或认知体感出现变化"] : [], mindCount >= 2 ? "建议进一步进行睡眠、压力、情绪及认知专项评估。" : undefined),
    domain("gut", "胃肠与排便状态", gutCombination ? "evaluate" : levelFromCount(gutSignalCount), gutCombination ? ["排便、腹胀或食物相关不适组合出现"] : [], gutCombination ? "可提高胃肠与肠道微生态评估优先级；问卷本身不判断菌群状态。" : undefined),
    domain("metabolism", "代谢相关体感", metabolicSignals.length >= 2 ? "evaluate" : levelFromCount(metabolicSignals.length), metabolicSignals.length ? ["腹部、餐后体感或生活方式信号叠加"] : [], metabolicSignals.length >= 2 ? "建议进入血糖—胰岛素、血脂、肝脏、尿酸及体成分等代谢方向评估。" : undefined),
    domain("cardio", "心肺与运动能力", levelFromCount(cardioCount), cardioCount ? ["心肺耐力或心跳体感出现变化"] : []),
    domain("muscle", "肌肉与功能储备", muscleCount >= 2 ? "evaluate" : levelFromCount(muscleCount), muscleCount ? ["力量、活动或运动恢复出现变化"] : [], muscleCount >= 2 ? "建议增加体成分、骨骼肌量、握力与基础运动能力评估。" : undefined),
    domain("maleUrology", "男性活力与泌尿状态", maleEvaluate ? "evaluate" : maleDeclines > 0 ? "signal" : "stable", maleEvaluate ? [urologyTrigger ? "存在泌尿专项评估线索" : "男性活力与功能储备体感同时出现变化"] : [], urologyTrigger ? "建议进入男性泌尿系统专项评估；问卷不直接判断前列腺疾病。" : maleEvaluate ? "男性活力相关体感较既往出现变化，建议结合年龄、症状及临床需要评估男性激素与相关健康因素。" : undefined),
  ];

  if (redFlags.length) {
    domains = domains.map((item) => ({
      ...item,
      level: "clinical_priority",
      reasons: ["医学安全信息需要医务人员优先核实"],
      recommendation: "请先由医务人员完成信息核实与风险判断，再决定后续健康管理路径。",
    }));
  }

  return { domains, hasRedFlag: redFlags.length > 0, redFlags };
}

