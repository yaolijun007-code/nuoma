import { maleHealthV1 } from "../domain/questionnaire";
import type { Question, QuestionOption } from "../domain/types";

export interface HospitalSurveyModule {
  id: string;
  index: number;
  title: string;
  introTitle: string;
  introDescription: string;
  tone?: "default" | "safety";
}

export type HospitalSurveyPage =
  | { id: string; kind: "intro"; moduleId: string; title: string; description: string; tone?: "default" | "safety"; autoAdvanceMs?: number }
  | { id: string; kind: "question"; moduleId: string; question: Question };

export interface HospitalSurveyDefinition {
  version: string;
  modules: HospitalSurveyModule[];
  pages: HospitalSurveyPage[];
}

const legacyQuestions = new Map(
  maleHealthV1.sections.flatMap((section) => section.questions).map((question) => [question.id, question]),
);

const cloneLegacy = (id: string, overrides: Partial<Question> = {}): Question => {
  const question = legacyQuestions.get(id);
  if (!question) throw new Error(`缺少既有题目：${id}`);
  return { ...question, ...overrides, options: overrides.options ?? question.options };
};

const options = (labels: string[]): QuestionOption[] => labels.map((label, index) => ({ value: String(index), label }));

export const hospitalModules: HospitalSurveyModule[] = [
  { id: "identity", index: 1, title: "基本信息", introTitle: "先从基本信息开始", introDescription: "只需填写姓名与手机号，日期将由系统自动记录。" },
  { id: "overall", index: 2, title: "当前关注与整体状态", introTitle: "先了解您最关注的变化", introDescription: "这些选择将帮助健康管理师确定后续沟通重点。" },
  { id: "energy", index: 3, title: "精力与恢复", introTitle: "接下来了解您的精力与恢复", introDescription: "请根据过去4周的真实感受选择。" },
  { id: "sleep", index: 4, title: "睡眠与日间状态", introTitle: "接下来了解您的睡眠状态", introDescription: "睡眠与精力、代谢、恢复和日间功能密切相关。" },
  { id: "mind", index: 5, title: "压力与认知", introTitle: "接下来了解压力与认知状态", introDescription: "请回想过去4周工作、休息与交流时的状态。" },
  { id: "gut", index: 6, title: "胃肠与排便", introTitle: "接下来了解胃肠与排便", introDescription: "这些体验会与后续微生态检测数据一起综合分析。" },
  { id: "metabolism", index: 7, title: "代谢与体重", introTitle: "接下来了解代谢与体重变化", introDescription: "只需根据日常体感作答，不需要参考体检结果。" },
  { id: "movement", index: 8, title: "心肺、运动与肌肉", introTitle: "接下来了解身体功能储备", introDescription: "请比较近期活动、力量与运动恢复状态。" },
  { id: "male", index: 9, title: "男性活力与排尿", introTitle: "男性活力与排尿状态", introDescription: "以下属于男性健康常规评估信息，仅用于综合健康状态分析。" },
  { id: "lifestyle", index: 10, title: "生活方式与医学安全", introTitle: "最后了解生活方式与安全信息", introDescription: "这部分将帮助我们安排后续健康管理与人工确认。" },
];

const intro = (module: HospitalSurveyModule): HospitalSurveyPage => ({
  id: `intro:${module.id}`,
  kind: "intro",
  moduleId: module.id,
  title: module.introTitle,
  description: module.introDescription,
  tone: module.tone,
  autoAdvanceMs: 780,
});

const page = (moduleId: string, question: Question): HospitalSurveyPage => ({ id: question.id, kind: "question", moduleId, question });
const regular = (moduleId: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => page(moduleId, cloneLegacy(`q${from + index}`, { autoAdvance: true, subtitle: "请根据过去4周实际情况选择" })));

const topConcernOptions = options([
  "精力不足", "睡眠", "体重或腹部脂肪", "排便或胃肠不适", "压力与情绪", "记忆力或注意力",
  "运动能力", "肌肉力量", "腰背或关节不适", "男性活力", "排尿问题", "饮酒后的身体恢复",
]);

const pages: HospitalSurveyPage[] = [];
for (const module of hospitalModules) {
  pages.push(intro(module));
  if (module.id === "identity") {
    pages.push(
      page("identity", { id: "name", prompt: "请问您的姓名是？", subtitle: "用于院内健康记录匹配", type: "text", required: true, placeholder: "请输入真实姓名", autocomplete: "name" }),
      page("identity", { id: "phone", prompt: "请填写您的手机号码", subtitle: "用于记录查询与医务人员后续联系", type: "phone", required: true, placeholder: "请输入11位手机号", autocomplete: "tel" }),
    );
  }
  if (module.id === "overall") {
    pages.push(
      page("overall", { id: "topConcerns", prompt: "目前最希望优先改善哪些问题？", subtitle: "请选择3项", type: "multi", required: true, minSelections: 3, maxSelections: 3, layout: "grid", options: topConcernOptions }),
      page("overall", { id: "mainChange", prompt: "最近半年，您感受最明显的身体变化是？", type: "single", required: true, autoAdvance: true, options: options(["精力下降", "睡眠变差", "腹部更容易长肉", "胃肠或排便变化", "压力或情绪变化", "注意力或记忆下降", "运动能力下降", "力量下降", "腰背或关节不适", "男性活力下降", "排尿变化", "没有明显变化"]) }),
      ...regular("overall", 1, 3),
    );
  }
  if (module.id === "energy") pages.push(...regular("energy", 4, 8));
  if (module.id === "sleep") pages.push(...regular("sleep", 9, 14));
  if (module.id === "mind") pages.push(...regular("mind", 15, 19));
  if (module.id === "gut") {
    pages.push(
      page("gut", cloneLegacy("q20", { prompt: "过去4周，您的排便通常属于哪种情况？", autoAdvance: true, subtitle: "请选择最符合日常情况的一项", options: options(["每天2次或以上，比较规律", "通常每天1次", "通常每2天1次", "每3天或更久1次", "频率变化较大、不规律"]) })),
      ...regular("gut", 21, 25),
      page("gut", { id: "q25Foods", prompt: "哪些食物比较容易引起不适？", subtitle: "可多选", type: "multi", required: true, minSelections: 1, layout: "grid", visibleWhen: { questionId: "q25", operator: "equals", values: ["3", "4"] }, options: options(["乳制品", "面食/小麦", "豆类", "洋葱/蒜", "辛辣食物", "油腻食物", "酒精", "部分水果", "海鲜", "坚果", "暂不确定"]) }),
    );
  }
  if (module.id === "metabolism") pages.push(...regular("metabolism", 26, 29));
  if (module.id === "movement") pages.push(...regular("movement", 30, 34));
  if (module.id === "male") {
    pages.push(...Array.from({ length: 6 }, (_, index) => {
      const number = 35 + index;
      return page("male", cloneLegacy(`q${number}`, { autoAdvance: true, allowSkip: number <= 37, subtitle: "请根据实际情况选择" }));
    }));
  }
  if (module.id === "lifestyle") {
    pages.push(
      page("lifestyle", { id: "workStatus", prompt: "您目前的职业状态是？", type: "single", required: true, autoAdvance: true, options: options(["规律日间工作", "经常加班", "倒班或夜班", "工作时间不规律", "自由职业", "其他/不固定"]) }),
      ...regular("lifestyle", 41, 44),
      page("lifestyle", { id: "q44DrinkType", prompt: "您平时主要饮用哪类酒？", type: "single", required: true, autoAdvance: true, visibleWhen: { questionId: "q44", operator: "notEquals", values: ["0"] }, options: options(["白酒", "啤酒", "葡萄酒", "黄酒", "洋酒/烈酒", "多种"]) }),
      ...regular("lifestyle", 45, 46),
      page("lifestyle", cloneLegacy("q47", { prompt: "过去4周，以下哪些食物您基本每周都会吃？", subtitle: "可多选", type: "multi", minSelections: 1, autoAdvance: false, layout: "grid", exclusiveOption: "5", options: options(["蔬菜", "水果", "全谷物/杂粮", "豆类/豆制品", "坚果/种子", "上述食物平时都比较少"]) })),
      page("lifestyle", cloneLegacy("q48", { subtitle: "可多选", minSelections: 1, autoAdvance: false, layout: "grid", exclusiveOption: "10" })),
      page("lifestyle", { id: "q48AntibioticWhen", prompt: "最近一次使用抗生素大约是什么时候？", type: "single", required: true, autoAdvance: true, visibleWhen: { questionId: "q48", operator: "includes", values: ["0"] }, options: options(["2周以内", "2—4周", "1—3个月", "记不清"]) }),
      { id: "intro:safety", kind: "intro", moduleId: "lifestyle", title: "医学安全信息", description: "以下信息不参与健康评分，仅用于判断是否需要医务人员进一步了解。", tone: "safety" },
      ...Array.from({ length: 7 }, (_, index) => {
        const number = 49 + index;
        return page("lifestyle", cloneLegacy(`q${number}`, { autoAdvance: false, confirmRequired: number === 55, tone: "safety", subtitle: "以下信息不参与健康评分" }));
      }),
      page("lifestyle", { id: "twelveWeekGoals", prompt: "未来12周，您最愿意开始做哪些改变？", subtitle: "最多选择3项", type: "multi", required: true, minSelections: 1, maxSelections: 3, layout: "grid", options: options(["更规律地安排睡眠", "每周增加有氧运动", "每周增加力量训练", "减少饮酒", "减少夜宵和过晚进食", "增加蔬菜、全谷物和豆类", "调整体重和腰围", "记录排便和胃肠反应", "管理工作压力", "减少久坐", "按计划完成微生态健康管理", "定期记录身体变化"]) }),
      page("lifestyle", { id: "singleImprovement", prompt: "如果未来12周只能优先看到一项改善，您最希望是哪一项？", type: "single", required: true, autoAdvance: false, optionsFromAnswerId: "topConcerns", options: [] }),
    );
  }
}

export const hospitalSurvey: HospitalSurveyDefinition = {
  version: "male-health-v1.0",
  modules: hospitalModules,
  pages,
};

export function findHospitalQuestion(id: string): Question | undefined {
  const page = hospitalSurvey.pages.find((item) => item.kind === "question" && item.id === id);
  return page?.kind === "question" ? page.question : undefined;
}
