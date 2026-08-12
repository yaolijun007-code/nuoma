import type { Question, QuestionOption, QuestionnaireDefinition } from "./types";

const scored = (labels: string[]): QuestionOption[] =>
  labels.map((label, score) => ({ value: String(score), label, score }));

const frequency = scored(["从不", "偶尔", "有时", "经常", "几乎每天"]);
const trend = scored(["明显变好", "略有变好", "基本没变化", "略有下降", "明显下降"]);
const yesNo: QuestionOption[] = [
  { value: "0", label: "否", score: 0 },
  { value: "1", label: "是", score: 1 },
];

const single = (number: number, prompt: string, options: QuestionOption[] = frequency): Question => ({
  id: `q${number}`,
  number,
  prompt,
  type: "single",
  options,
  required: true,
});

export const maleHealthV1: QuestionnaireDefinition = {
  version: "male-health-v1.0",
  title: "健康与功能状态问卷",
  audience: "40—55岁男性，以45岁左右人群为核心",
  estimatedMinutes: "约6—8分钟",
  sections: [
    {
      id: "identity",
      eyebrow: "开始之前",
      title: "基本信息",
      description: "信息仅用于院内健康评估与记录匹配。",
      questions: [
        { id: "name", prompt: "姓名", type: "text", required: true, placeholder: "请输入真实姓名" },
        { id: "age", prompt: "年龄", type: "number", required: true, placeholder: "40—55" },
        { id: "phoneLast4", prompt: "手机号后4位", type: "text", required: true, placeholder: "例如 0826", helper: "仅用于区分同名客户，不收集完整手机号。" },
        { id: "date", prompt: "填写日期", type: "date", required: true },
        { id: "workStatus", prompt: "职业状态", type: "single", required: true, options: ["规律日间工作", "经常加班", "倒班或夜班", "工作时间不规律", "自由职业", "其他"].map((label, index) => ({ value: String(index), label })) },
        { id: "workStatusOther", prompt: "其他职业状态", type: "text", placeholder: "如选择其他，请填写" },
        { id: "topConcerns", prompt: "如果只能优先改善3个问题，您目前最希望改善的是", type: "multi", required: true, maxSelections: 3, options: ["精力不足", "睡眠", "体重或腹部脂肪", "排便或胃肠不适", "压力与情绪", "记忆力或注意力", "运动能力", "肌肉力量", "腰背或关节不适", "性欲或性功能", "排尿问题", "饮酒后的身体恢复", "其他"].map((label, index) => ({ value: String(index), label })) },
        { id: "topConcernsOther", prompt: "其他希望改善的问题", type: "text", placeholder: "请简要填写" },
        { id: "mainChange", prompt: "最近半年，您自己感受最明显的一项身体变化是", type: "text", required: true, placeholder: "用一两句话描述即可" },
      ],
    },
    {
      id: "overall",
      eyebrow: "01 / 整体状态",
      title: "整体健康与年龄感",
      description: "请根据过去4周的实际感受选择。",
      questions: [
        single(1, "您如何评价自己目前整体身体状态？", scored(["很好", "较好", "一般", "较差", "很差"])),
        single(2, "与2—3年前相比，您的整体精力和身体状态：", trend),
        single(3, "与年龄相近的男性相比，您主观感觉自己的身体状态：", scored(["明显更年轻", "略好一些", "基本相当", "略差一些", "明显更差"])),
      ],
    },
    {
      id: "energy",
      eyebrow: "02 / 恢复力",
      title: "精力、疲劳与恢复",
      questions: [
        single(4, "早晨醒来后仍感觉身体没有恢复、依然疲劳。"),
        single(5, "白天容易出现没有明显原因的疲劳或精力不足。"),
        single(6, "午饭后容易明显犯困、精神下降或工作效率降低。"),
        single(7, "熬夜、应酬、饮酒或高强度工作后，身体通常需要超过1天才能恢复。"),
        single(8, "与过去相比，持续工作、运动或参加社交活动时更容易感觉“撑不住”。"),
      ],
    },
    {
      id: "sleep",
      eyebrow: "03 / 睡眠",
      title: "睡眠与日间状态",
      questions: [
        single(9, "过去4周平均每晚实际睡眠时间：", scored(["≥7小时", "6—7小时", "5—6小时", "4—5小时", "＜4小时"])),
        single(10, "躺下后较长时间仍无法入睡。"),
        single(11, "夜间容易醒来，或醒来后难以再次入睡。"),
        single(12, "是否存在明显打鼾，或家人曾发现睡眠中有呼吸暂停、憋气现象？", scored(["从无", "偶尔打鼾", "经常打鼾", "打鼾非常明显", "家人观察到呼吸暂停或憋气"])),
        single(13, "白天坐着、开会、看电视或乘车时容易打瞌睡。"),
        single(14, "工作日睡眠不足，需要在周末明显补觉才能恢复。"),
      ],
    },
    {
      id: "mind",
      eyebrow: "04 / 心智",
      title: "压力、情绪与认知状态",
      questions: [
        single(15, "最近容易烦躁、耐心下降或比以前更容易发脾气。"),
        single(16, "即使已经下班或休息，脑子仍停不下来，很难真正放松。"),
        single(17, "工作、阅读或交流时，比以前更容易注意力不集中。"),
        single(18, "最近感觉记忆力下降、容易忘事、反应变慢或出现明显“脑子发木”的感觉。"),
        single(19, "对过去感兴趣的工作、运动、社交或其他事情，兴趣和主动性下降。"),
      ],
    },
    {
      id: "gut",
      eyebrow: "05 / 消化",
      title: "胃肠与排便体验",
      questions: [
        single(20, "您通常的排便频率：", scored(["每天1—2次", "大多数每天1次", "约每2天1次", "每周少于3次", "每天≥3次或明显不规律"])),
        single(21, "排便时经常费力、大便偏硬或有排不干净的感觉。"),
        single(22, "经常出现大便偏稀、突然便意或来不及排便的情况。"),
        single(23, "饭后或一天中经常出现腹胀、排气明显增多。"),
        single(24, "经常出现腹部不舒服、隐痛、反酸、烧心或胃部胀满。"),
        single(25, "吃某些食物后容易出现腹胀、腹泻、腹痛、反酸或明显不舒服。", scored(["从无", "偶尔", "有，但没有明确食物", "有比较明确的食物", "多类食物都会引起不适"])),
        { id: "q25Food", prompt: "如有明确食物，请填写", type: "text", placeholder: "例如奶制品、辛辣食物" },
      ],
    },
    {
      id: "metabolism",
      eyebrow: "06 / 代谢",
      title: "食欲、腹部变化与代谢体感",
      questions: [
        single(26, "与2—3年前相比，腹部更容易长肉、腰带变紧或肚子明显增大。", scored(["明显改善", "略有改善", "基本没变化", "略有增加", "明显增加"])),
        single(27, "吃完主食、甜食或较丰盛的一餐后容易明显犯困。"),
        single(28, "经常容易饿、想吃甜食、零食，或者晚上特别想吃东西。"),
        single(29, "与过去相比，即使饮食变化不大，体重或腰围也比以前更难控制。"),
      ],
    },
    {
      id: "movement",
      eyebrow: "07 / 功能储备",
      title: "心肺耐力、运动与肌肉状态",
      questions: [
        single(30, "与2—3年前相比，上两层楼、快走或短距离爬坡时更容易气喘或疲劳。", trend),
        single(31, "日常生活中会出现明显心慌、心跳不规律或突然感觉心跳很快。"),
        single(32, "与过去相比，搬东西、提重物、深蹲起立等动作时感觉力量下降。", trend),
        single(33, "同样强度的运动后，现在比以前更容易酸痛、疲劳或恢复时间延长。"),
        single(34, "腰、背、肩颈、膝关节或其他肌骨不适已经影响运动或日常活动。"),
      ],
    },
    {
      id: "maleHealth",
      eyebrow: "08 / 男性健康",
      title: "男性活力、性健康与排尿状态",
      description: "以下属于男性健康常规内容，用于判断是否需要进一步评估。",
      questions: [
        single(35, "与2—3年前相比，性欲有所下降。", scored(["明显增加", "略有增加", "基本没变化", "略有下降", "明显下降"])),
        single(36, "与过去相比，晨起自然勃起的频率明显减少。", scored(["明显增加", "略有增加", "基本没变化", "略有下降", "明显下降"])),
        single(37, "与过去相比，勃起硬度、维持时间或性生活满意度有所下降。", trend),
        single(38, "夜间需要起床排尿：", scored(["无", "通常1次", "通常2次", "通常3次", "≥4次"])),
        single(39, "排尿时出现等待、尿线变细、断断续续或需要用力。"),
        single(40, "排尿后仍感觉没有排干净，或经常突然出现明显尿意。"),
      ],
    },
    {
      id: "lifestyle",
      eyebrow: "09 / 驱动因素",
      title: "生活方式与健康驱动因素",
      questions: [
        single(41, "平均每天坐着不活动的时间约为：", scored(["＜4小时", "4—6小时", "6—8小时", "8—10小时", "＞10小时"])),
        single(42, "过去4周，每周进行中等及以上强度运动：", scored(["≥5天", "3—4天", "2天", "1天", "基本没有"])),
        single(43, "过去4周，每周进行力量或抗阻训练：", scored(["≥3次", "2次", "1次", "偶尔", "基本没有"])),
        single(44, "您目前饮酒情况：", scored(["基本不饮酒", "每月1—3次", "每周1—2次", "每周3—4次", "每周≥5次或经常一次喝较多"])),
        { id: "q44Drink", prompt: "最常饮用", type: "text", placeholder: "例如白酒、啤酒、红酒" },
        single(45, "您目前吸烟情况：", scored(["从不吸烟", "已戒烟", "偶尔吸", "每天吸烟但＜10支", "每天≥10支"])),
        single(46, "晚餐过晚、夜宵、应酬或睡前3小时内大量进食。"),
        single(47, "以下五类食物有几类能够稳定每周摄入：蔬菜、水果、全谷物/杂粮、豆类/豆制品、坚果/种子。", scored(["五类均较规律", "四类", "三类", "一至两类", "基本缺少上述食物"])),
        { id: "q48", number: 48, prompt: "近3个月是否使用过以下产品或药物？", type: "multi", required: true, options: ["抗生素", "泻药", "抑酸药", "益生菌", "益生元", "蛋白粉", "减重药物", "睡眠药物", "激素相关药物", "其他营养补充剂", "均无"].map((label, index) => ({ value: String(index), label })) },
        { id: "q48Details", prompt: "如有，请填写名称及大致使用时间", type: "text", placeholder: "名称及使用时间" },
      ],
    },
    {
      id: "safety",
      eyebrow: "10 / 医学安全",
      title: "医学安全信息",
      description: "以下问题不用于计算健康评分。如回答“是”，建议由医务人员进一步了解情况。",
      questions: [
        single(49, "过去3个月，活动时或休息时出现明显胸痛、胸闷或胸部压迫感？", yesNo),
        single(50, "过去3个月，出现晕厥、接近晕厥或突然失去意识？", yesNo),
        single(51, "过去3个月，出现原因不明且持续加重的呼吸困难？", yesNo),
        single(52, "过去3个月，出现便血、黑便或肉眼血尿？", yesNo),
        single(53, "非主动减重情况下出现明显体重下降，或持续明显食欲下降？", yesNo),
        single(54, "持续或反复出现比较明显的腹痛？", yesNo),
        single(55, "近期持续明显情绪低落、绝望，或出现伤害自己的想法？", yesNo),
      ],
    },
    {
      id: "goals",
      eyebrow: "11 / 行动意愿",
      title: "个人健康目标",
      questions: [
        { id: "twelveWeekGoals", prompt: "请选择未来12周最愿意实际改变的3件事情", type: "multi", required: true, maxSelections: 3, options: ["改善睡眠", "减少疲劳", "减少腹部脂肪", "改善排便", "减少腹胀", "增加运动", "增加力量训练", "减少饮酒", "改善饮食结构", "管理压力", "改善男性活力", "改善排尿", "提高注意力和工作效率", "其他"].map((label, index) => ({ value: String(index), label })) },
        { id: "twelveWeekGoalsOther", prompt: "其他目标", type: "text", placeholder: "请填写" },
        { id: "singleImprovement", prompt: "如果未来12周只能看到一个明显改善，您最希望是什么？", type: "text", required: true, placeholder: "写下最重要的一个变化" },
      ],
    },
  ],
};

