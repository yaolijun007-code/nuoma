import type { Question, QuestionOption, QuestionType, VisibilityRule } from "../domain/types";

export type FemaleSignal = "none" | "mild" | "moderate" | "marked" | "safety";

export interface FemaleQuestion extends Question {
  signalByValue?: Record<string, FemaleSignal>;
  signalBySelectedValue?: Record<string, FemaleSignal>;
  mutuallyExclusiveValues?: string[];
}

export interface FemaleSurveyModule {
  id: string;
  index: number;
  title: string;
  introTitle: string;
  introDescription: string;
  icon: string;
}

export type FemaleSurveyPage =
  | { id: string; kind: "intro"; moduleId: string; title: string; description: string; icon: string }
  | { id: string; kind: "question"; moduleId: string; question: FemaleQuestion };

const options = (labels: string[]): QuestionOption[] => labels.map((label, index) => ({ value: String(index), label }));
const signal = (...values: FemaleSignal[]) => Object.fromEntries(values.map((value, index) => [String(index), value]));
const visible = (questionId: string, values: string[]): VisibilityRule => ({ questionId, operator: "equals", values });

const question = (
  number: number,
  moduleId: string,
  prompt: string,
  type: QuestionType,
  labels: string[] = [],
  extra: Partial<FemaleQuestion> = {},
): FemaleSurveyPage => ({
  id: `f${number}`,
  kind: "question",
  moduleId,
  question: {
    id: `f${number}`,
    number,
    prompt,
    type,
    required: true,
    autoAdvance: type === "single",
    options: labels.length ? options(labels) : undefined,
    ...extra,
  },
});

export const femaleModules: FemaleSurveyModule[] = [
  { id: "identity", index: 1, title: "基本信息", introTitle: "先从基本信息开始", introDescription: "姓名与手机号用于院内记录匹配，填写日期由系统自动生成。", icon: "user" },
  { id: "lifecycle", index: 2, title: "女性生命周期", introTitle: "了解您当前的女性生命周期状态", introDescription: "月经和血管舒缩变化有助于安排更适合的健康评估。", icon: "flower" },
  { id: "mind", index: 3, title: "睡眠、情绪与认知", introTitle: "关注睡眠与身心状态", introDescription: "请根据过去4周的真实感受作答。", icon: "moon" },
  { id: "metabolic", index: 4, title: "代谢与心血管", introTitle: "了解体重、代谢与活动感受", introDescription: "只需描述日常变化，不需要参考体检结果。", icon: "heart" },
  { id: "movement", index: 5, title: "骨骼、肌肉与功能", introTitle: "了解骨骼与身体功能储备", introDescription: "请比较近期力量、活动和身体姿势变化。", icon: "activity" },
  { id: "women", index: 6, title: "乳腺、妇科与泌尿生殖", introTitle: "女性专项健康信息", introDescription: "这些问题用于判断是否需要进一步专项评估，可以按实际情况作答。", icon: "shield" },
  { id: "gut", index: 7, title: "消化与肠道微生态", introTitle: "了解消化与排便状态", introDescription: "胃肠体感将与饮食和既往用药一起综合分析。", icon: "leaf" },
  { id: "history", index: 8, title: "生活方式与既往健康", introTitle: "最后了解生活方式和健康背景", introDescription: "用于安排筛查、体检与后续健康管理重点。", icon: "clipboard" },
  { id: "priorities", index: 9, title: "当前重点需求", introTitle: "您最希望解决什么", introDescription: "请选择本次最希望关注的方向。", icon: "target" },
  { id: "overall", index: 10, title: "整体健康感受", introTitle: "整体健康感受", introDescription: "用您自己的感受完成最后两题。", icon: "sparkles" },
];

const q: FemaleSurveyPage[] = [
  question(1, "identity", "请问您的姓名是？", "text", [], { placeholder: "请输入真实姓名", autocomplete: "name", autoAdvance: false }),
  question(2, "identity", "请填写您的手机号码", "phone", [], { placeholder: "请输入11位手机号", autocomplete: "tel", autoAdvance: false }),
  question(3, "identity", "填写日期", "date", [], { autoAdvance: false, helper: "由系统自动生成" }),
  question(4, "identity", "您目前的年龄是？", "single", ["40—44岁", "45—49岁", "50—54岁", "55—59岁", "60—64岁", "65—69岁", "70岁及以上"]),

  question(5, "lifecycle", "您目前的月经状态最符合以下哪一种？", "single", ["月经基本规律", "仍有月经，但周期开始出现变化", "月经很不规律，有时数月不来", "已停经，但不足12个月", "已连续12个月以上没有月经", "因子宫切除等原因无法根据月经判断", "因药物、手术或其他治疗导致停经", "不清楚"], { signalByValue: signal("none", "mild", "moderate", "moderate", "none", "none", "moderate", "mild") }),
  question(6, "lifecycle", "过去12个月月经周期与以前相比有变化吗？", "single", ["基本没有变化", "偶尔提前或推迟", "周期明显变短或变长", "经常出现较长时间不来月经", "变化很大，没有明显规律"], { visibleWhen: visible("f5", ["0", "1", "2"]), signalByValue: signal("none", "mild", "moderate", "marked", "marked") }),
  question(7, "lifecycle", "过去12个月经量或经期有明显变化吗？", "single", ["没有明显变化", "经量比以前明显减少", "经量比以前明显增加", "经期明显延长", "经量明显增加且容易头晕、乏力", "不确定"], { visibleWhen: visible("f5", ["0", "1", "2"]), signalByValue: signal("none", "mild", "moderate", "moderate", "marked", "mild") }),
  question(8, "lifecycle", "连续停经12个月以后，是否再次出现过阴道出血或血性分泌物？", "single", ["没有", "有过1次", "有过2次及以上", "目前仍有", "不确定"], { visibleWhen: visible("f5", ["4"]), tone: "safety", autoAdvance: false, signalByValue: signal("none", "safety", "safety", "safety", "moderate") }),
  question(9, "lifecycle", "过去4周，是否出现突然发热、面部或上半身潮红？", "single", ["没有", "偶尔", "经常", "频繁，已经影响生活或工作"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(10, "lifecycle", "过去4周，是否出现夜间出汗明显，甚至因为出汗醒来？", "single", ["没有", "偶尔", "经常", "频繁，明显影响睡眠"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(11, "lifecycle", "目前是否存在以下情况？", "multi", ["做过子宫切除手术", "切除过一侧卵巢", "切除过双侧卵巢", "接受过化疗或放疗", "正在使用雌激素/孕激素等激素治疗", "正在使用口服避孕药或其他激素类药物", "正在备孕", "目前怀孕", "目前哺乳", "以上均无", "不清楚"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["9", "10"], signalBySelectedValue: { "2": "moderate", "3": "moderate" } }),

  question(12, "mind", "您目前平均每晚实际睡眠时间大约是多少？", "single", ["7小时及以上", "6—7小时", "5—6小时", "少于5小时", "睡眠时间很不规律"], { signalByValue: signal("none", "mild", "moderate", "marked", "moderate") }),
  question(13, "mind", "过去4周，入睡是否比以前困难？", "single", ["没有", "偶尔", "经常", "几乎每天"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(14, "mind", "过去4周，是否经常夜间醒来或醒后较难再次入睡？", "single", ["没有", "偶尔", "经常", "几乎每天"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(15, "mind", "过去4周，早晨醒来后是否仍感觉疲劳、没有恢复感？", "single", ["基本没有", "偶尔", "经常", "几乎每天"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(16, "mind", "过去4周，是否比以前更容易烦躁、情绪波动或容易生气？", "single", ["没有明显变化", "轻微", "比较明显", "非常明显，已经影响生活或工作"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(17, "mind", "过去4周，是否经常感到情绪低落、兴趣下降或缺少动力？", "single", ["没有", "偶尔", "经常", "几乎每天"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(18, "mind", "过去4周，是否经常感到紧张、焦虑、担心很多事情或难以放松？", "single", ["没有", "偶尔", "经常", "几乎每天"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(19, "mind", "与1—2年前相比，注意力、记忆力或思维清晰度是否下降？", "single", ["没有明显变化", "轻微下降", "明显下降", "下降很多，已经影响工作或生活"], { signalByValue: signal("none", "mild", "moderate", "marked") }),

  question(20, "metabolic", "过去1年，您的体重变化最符合哪种情况？", "single", ["基本稳定", "明显减轻", "增加约2—5公斤", "增加5公斤以上", "体重反复波动较大", "不清楚"], { signalByValue: signal("none", "moderate", "mild", "moderate", "moderate", "mild") }),
  question(21, "metabolic", "最近1—2年是否感觉腰腹部比以前更容易长胖？", "single", ["没有", "有一点", "比较明显", "非常明显"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(22, "metabolic", "过去4周，是否经常餐后困倦、很快又饿或特别想吃甜食/精制主食？", "single", ["基本没有", "偶尔", "经常", "非常明显"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(23, "metabolic", "与过去相比，步行、爬楼或日常活动时是否更容易胸闷、气短、心慌或耐力下降？", "single", ["没有", "偶尔出现", "比以前明显", "经常出现", "最近明显加重"], { tone: "safety", autoAdvance: false, signalByValue: signal("none", "mild", "moderate", "marked", "safety") }),
  question(24, "metabolic", "近期是否出现过活动时明显胸痛、接近晕厥或真正晕倒？", "single", ["没有", "有过1次", "有过多次", "最近正在发生或明显加重"], { tone: "safety", autoAdvance: false, signalByValue: signal("none", "safety", "safety", "safety") }),
  question(25, "metabolic", "睡觉时是否存在明显打鼾、呼吸暂停或白天容易困倦？", "single", ["没有", "偶尔", "经常打鼾", "家人发现有呼吸暂停", "白天困倦非常明显", "不清楚"], { signalByValue: signal("none", "mild", "moderate", "marked", "marked", "mild") }),
  question(26, "metabolic", "过去半年是否出现以下变化？", "multi", ["比以前明显怕冷", "比以前明显怕热", "无明显原因心慌", "手抖", "无明显原因体重下降", "无明显原因体重增加", "颈部感觉增粗或有肿块", "以上均无"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["7"], signalBySelectedValue: { "0": "mild", "1": "mild", "2": "moderate", "3": "moderate", "4": "moderate", "5": "moderate", "6": "marked" } }),

  question(27, "movement", "过去4周，腰背、颈肩、膝关节或其他关节是否经常疼痛或酸胀？", "single", ["没有", "偶尔", "经常", "几乎每天", "已影响活动或睡眠"], { signalByValue: signal("none", "mild", "moderate", "marked", "marked") }),
  question(28, "movement", "最近几年，是否感觉身高变矮、驼背或身体姿势明显改变？", "single", ["没有", "好像有一点", "比较明显", "非常明显", "不清楚"], { signalByValue: signal("none", "mild", "moderate", "marked", "mild") }),
  question(29, "movement", "40岁以后是否发生过跌倒或轻微碰撞后骨折？", "single", ["没有", "有过1次", "有过2次及以上", "不确定"], { signalByValue: signal("none", "moderate", "marked", "mild") }),
  question(30, "movement", "与1—2年前相比，以下哪些动作变得更困难？", "multi", ["从椅子上站起来", "连续爬两层楼", "提购物袋或较重物品", "长时间步行", "单脚站立", "最近一年有过跌倒", "均没有明显变化"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["6"], signalBySelectedValue: { "0": "moderate", "1": "moderate", "2": "moderate", "3": "moderate", "4": "moderate", "5": "marked" } }),

  question(31, "women", "最近是否发现乳房出现以下变化？", "multi", ["新出现的乳房肿块", "乳头血性分泌物", "乳头明显凹陷或近期形态改变", "乳房皮肤明显凹陷、橘皮样改变", "持续存在的局部乳房疼痛", "没有以上情况"], { tone: "safety", autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["5"], signalBySelectedValue: { "0": "safety", "1": "safety", "2": "safety", "3": "safety", "4": "moderate" } }),
  question(32, "women", "过去4周，是否经常出现下腹部或盆腔持续胀痛、坠胀或不适？", "single", ["没有", "偶尔", "经常", "几乎每天", "最近明显加重"], { tone: "safety", autoAdvance: false, signalByValue: signal("none", "mild", "moderate", "marked", "safety") }),
  question(33, "women", "过去4周，阴道分泌物是否出现明显异常？", "multi", ["没有明显异常", "分泌物明显增多", "有明显异味", "外阴或阴道瘙痒", "反复出现不适", "出现血性分泌物"], { tone: "safety", autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["0"], signalBySelectedValue: { "1": "mild", "2": "moderate", "3": "moderate", "4": "moderate", "5": "safety" } }),
  question(34, "women", "过去4周，是否存在阴道干涩、灼热或摩擦不适？", "single", ["没有", "偶尔", "经常", "比较严重", "不便回答"], { signalByValue: signal("none", "mild", "moderate", "marked", "none") }),
  question(35, "women", "是否存在因阴道干涩或疼痛导致性生活不适？", "single", ["没有", "偶尔", "经常", "已明显影响生活", "无性生活/不适用", "不便回答"], { required: false, allowSkip: true, autoAdvance: false, signalByValue: signal("none", "mild", "moderate", "marked", "none", "none") }),
  question(36, "women", "过去4周，是否存在尿频、尿急或夜间起夜增多？", "single", ["没有", "偶尔", "经常", "非常明显"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(37, "women", "咳嗽、大笑、打喷嚏、跑跳或提重物时是否会漏尿？", "single", ["从不", "偶尔", "经常", "几乎每次都会"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(38, "women", "过去12个月是否反复出现尿路感染或排尿疼痛、烧灼感？", "single", ["没有", "1次", "2次", "3次及以上", "不清楚"], { signalByValue: signal("none", "mild", "moderate", "marked", "mild") }),
  question(39, "women", "您最近一次宫颈筛查距今多久？", "single", ["1年以内", "1—3年", "3—5年", "超过5年", "从未做过", "子宫/宫颈已切除", "不清楚"]),
  question(40, "women", "您最近一次乳腺影像检查距今多久？", "single", ["1年以内", "1—2年", "超过2年", "从未做过", "不清楚"]),

  question(41, "gut", "过去4周，您的排便状态最符合哪一种？", "single", ["基本规律，没有明显不适", "经常便秘或排便费力", "经常大便偏稀或腹泻", "便秘与腹泻交替", "排便次数或性状变化较大"], { signalByValue: signal("none", "moderate", "moderate", "marked", "moderate") }),
  question(42, "gut", "过去4周，腹胀、排气增多或腹部不舒服的情况如何？", "single", ["基本没有", "偶尔", "经常", "几乎每天"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(43, "gut", "某些食物吃后是否特别容易出现腹胀、腹泻、腹痛或其他不适？", "single", ["没有明显感觉", "偶尔", "有明确的几类食物", "很多食物都会不舒服", "不清楚"], { signalByValue: signal("none", "mild", "moderate", "marked", "mild") }),
  question(44, "gut", "最近是否出现便血、黑便或排便习惯持续明显改变？", "single", ["没有", "偶尔有便血", "曾出现黑便", "排便习惯持续改变超过2周", "同时伴有明显消瘦或腹痛", "不确定"], { tone: "safety", autoAdvance: false, signalByValue: signal("none", "safety", "safety", "safety", "safety", "moderate") }),
  question(45, "gut", "过去3个月是否使用过以下产品或药物？", "multi", ["抗生素", "泻药", "胃肠动力药", "益生菌", "益生元/膳食纤维补充剂", "减重药物", "以上均无", "不清楚"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["6", "7"] }),

  question(46, "history", "您目前的运动状态最符合哪一种？", "single", ["每周规律运动3次及以上，并包含力量训练", "每周运动3次及以上，但基本没有力量训练", "每周运动1—2次", "偶尔活动，没有规律运动", "基本不运动"], { signalByValue: signal("none", "mild", "mild", "moderate", "marked") }),
  question(47, "history", "您目前日常饮食最符合哪些情况？", "multi", ["每天基本能吃到多种蔬菜", "经常吃水果", "经常吃全谷物或杂粮", "经常吃豆类或豆制品", "经常吃鱼类", "红肉或加工肉较多", "甜品、含糖饮料较多", "外卖、外食较多", "饮食比较单一", "很难判断"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["9"], signalBySelectedValue: { "5": "mild", "6": "mild", "7": "mild", "8": "moderate" } }),
  question(48, "history", "您目前吸烟和饮酒情况如何？", "multi", ["不吸烟", "目前吸烟", "已经戒烟", "基本不饮酒", "偶尔饮酒", "每周饮酒2次及以上"], { autoAdvance: false, minSelections: 2, signalBySelectedValue: { "1": "moderate", "5": "moderate" } }),
  question(49, "history", "医生是否曾经告诉您存在以下健康问题？", "multi", ["高血压", "血糖偏高或糖尿病", "血脂异常", "脂肪肝", "甲状腺疾病", "高尿酸", "骨量减少或骨质疏松", "乳腺疾病", "子宫或卵巢疾病", "心脑血管疾病", "自身免疫或风湿免疫疾病", "肾脏疾病", "恶性肿瘤", "以上均无", "不清楚"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["13", "14"] }),
  question(50, "history", "您目前是否长期使用以下药物或补充剂？", "multi", ["降压药", "降糖药", "降脂药", "甲状腺相关药物", "激素类药物", "糖皮质激素", "骨质疏松相关药物", "抗凝/抗血小板药物", "减重药物", "钙或维生素D", "其他营养补充剂", "没有长期使用", "不清楚"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["11", "12"] }),
  question(51, "history", "您的直系亲属中是否有人存在以下情况？", "multi", ["乳腺癌", "卵巢癌", "子宫内膜癌", "结直肠癌", "糖尿病", "较年轻时发生心肌梗死或脑卒中", "骨质疏松或髋部骨折", "以上均无", "不清楚"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["7", "8"] }),
  question(52, "history", "您是否做过结直肠癌相关筛查？", "single", ["近1年做过大便潜血等粪便检查", "近5年做过肠镜", "5—10年前做过肠镜", "10年以上前做过", "从未做过", "不清楚"]),

  question(53, "priorities", "如果这次健康体检可以重点帮您解决问题，您最希望关注哪些方面？", "multi", ["女性激素与围绝经期变化", "睡眠", "情绪与压力", "记忆力与注意力", "体重与腰腹脂肪", "血糖、血脂等代谢问题", "心脑血管健康", "甲状腺健康", "乳腺健康", "妇科健康", "阴道及泌尿健康", "骨质疏松", "肌肉与体能", "肠道与排便", "肠道微生态", "免疫与炎症", "衰老速度与健康寿命", "希望进行一次系统的综合评估"], { autoAdvance: false, minSelections: 1, maxSelections: 3, subtitle: "最多选择3项" }),
  question(54, "overall", "如果以1年前的自己作为参照，您觉得目前整体身体状态如何？", "single", ["比1年前更好", "基本没有变化", "稍有下降", "明显下降", "下降很多"], { signalByValue: signal("none", "none", "mild", "moderate", "marked") }),
  question(55, "overall", "如果用0—10分评价目前整体健康状态，您会给自己多少分？", "scale", [], { autoAdvance: false, helper: "0分：非常差 · 10分：非常好" }),
];

const questionsByModule = new Map<string, FemaleSurveyPage[]>();
for (const page of q) questionsByModule.set(page.moduleId, [...(questionsByModule.get(page.moduleId) ?? []), page]);

const pages: FemaleSurveyPage[] = [];
for (const module of femaleModules) {
  if (module.index >= 2 && module.index <= 8) {
    pages.push({ id: `intro:${module.id}`, kind: "intro", moduleId: module.id, title: module.introTitle, description: module.introDescription, icon: module.icon });
  }
  pages.push(...(questionsByModule.get(module.id) ?? []));
}

export const femaleSurvey = { version: "female-health-v1.0", modules: femaleModules, pages } as const;

export function findFemaleQuestion(id: string): FemaleQuestion | undefined {
  const page = femaleSurvey.pages.find((item) => item.kind === "question" && item.id === id);
  return page?.kind === "question" ? page.question : undefined;
}
