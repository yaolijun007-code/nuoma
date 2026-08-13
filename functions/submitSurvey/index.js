var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// functions/submitSurvey/src/index.ts
var index_exports = {};
__export(index_exports, {
  main: () => main
});
module.exports = __toCommonJS(index_exports);
var import_node_sdk = require("@cloudbase/node-sdk");

// src/domain/assessment.ts
var score = (answers, id) => Number(answers[id] ?? 0);
var high = (answers, id) => score(answers, id) >= 3;
var highCount = (answers, ids) => ids.filter((id) => high(answers, id)).length;
var levelFromCount = (count) => count >= 2 ? "evaluate" : count === 1 ? "signal" : "stable";
var copy = {
  stable: "\u5F53\u524D\u4F53\u611F\u57FA\u672C\u7A33\u5B9A\uFF0C\u5EFA\u8BAE\u4FDD\u6301\u5E76\u6301\u7EED\u89C2\u5BDF\u53D8\u5316\u3002",
  signal: "\u5F53\u524D\u5B58\u5728\u53D8\u5316\u4FE1\u53F7\uFF0C\u5EFA\u8BAE\u7ED3\u5408\u4F53\u68C0\u8D44\u6599\u6301\u7EED\u5173\u6CE8\u3002",
  evaluate: "\u5B58\u5728\u8FDB\u4E00\u6B65\u8BC4\u4F30\u7EBF\u7D22\uFF0C\u5EFA\u8BAE\u4E0E\u5065\u5EB7\u7BA1\u7406\u5E08\u5171\u540C\u786E\u8BA4\u4F18\u5148\u65B9\u5411\u3002"
};
function domain(id, title, level, reasons, recommendation = copy[level] ?? copy.evaluate) {
  return { id, title, level, reasons, recommendation };
}
function assessSurvey(answers) {
  const redFlags = Array.from({ length: 7 }, (_, index) => `q${49 + index}`).filter((id) => score(answers, id) === 1);
  const energyCount = highCount(answers, ["q2", "q4", "q5", "q6", "q7", "q8"]);
  const sleepScreen = score(answers, "q12") >= 2 || high(answers, "q13") || score(answers, "q9") <= 1 && high(answers, "q4");
  const mindCount = highCount(answers, ["q15", "q16", "q17", "q18", "q19"]);
  const bowelAbnormal = score(answers, "q20") >= 3 || high(answers, "q21") || high(answers, "q22");
  const gutCombination = bowelAbnormal && high(answers, "q23") || bowelAbnormal && score(answers, "q25") >= 3 || high(answers, "q23") && score(answers, "q25") >= 3 || Array.isArray(answers.q48) && answers.q48.includes("0") && highCount(answers, ["q21", "q22", "q23", "q24"]) >= 1;
  const gutSignalCount = highCount(answers, ["q20", "q21", "q22", "q23", "q24", "q25"]);
  const metabolicSignals = ["q26", "q27", "q28", "q29", "q41", "q44", "q46"].filter((id) => high(answers, id));
  const cardioCount = highCount(answers, ["q30", "q31"]);
  const muscleCount = highCount(answers, ["q30", "q32", "q33", "q34", "q42"]);
  const maleDeclines = highCount(answers, ["q35", "q36", "q37"]);
  const reserveDecline = highCount(answers, ["q5", "q32", "q33"]) >= 1;
  const urologyTrigger = score(answers, "q38") >= 2 || high(answers, "q39") || high(answers, "q40");
  const maleEvaluate = urologyTrigger || maleDeclines >= 2 && reserveDecline;
  let domains = [
    domain("energy", "\u7CBE\u529B\u4E0E\u6062\u590D", levelFromCount(energyCount), energyCount ? ["\u7CBE\u529B\u6216\u6062\u590D\u4F53\u611F\u8F83\u65E2\u5F80\u51FA\u73B0\u53D8\u5316"] : []),
    domain(
      "sleep",
      "\u7761\u7720\u4E0E\u65E5\u95F4\u72B6\u6001",
      sleepScreen ? "evaluate" : levelFromCount(highCount(answers, ["q9", "q10", "q11", "q13", "q14"])),
      sleepScreen ? ["\u5B58\u5728\u7761\u7720\u8D28\u91CF\u6216\u7761\u7720\u547C\u5438\u76F8\u5173\u7EBF\u7D22"] : [],
      sleepScreen ? "\u5B58\u5728\u7761\u7720\u8D28\u91CF\u6216\u7761\u7720\u547C\u5438\u76F8\u5173\u7EBF\u7D22\uFF0C\u5EFA\u8BAE\u8FDB\u4E00\u6B65\u5B8C\u6210\u6807\u51C6\u5316\u7761\u7720\u98CE\u9669\u8BC4\u4F30\uFF1B\u5FC5\u8981\u65F6\u8FDB\u5165\u7761\u7720\u533B\u5B66\u8BC4\u4F30\u3002" : void 0
    ),
    domain("mind", "\u538B\u529B\u4E0E\u8BA4\u77E5\u72B6\u6001", mindCount >= 2 ? "evaluate" : levelFromCount(mindCount), mindCount ? ["\u538B\u529B\u3001\u60C5\u7EEA\u6216\u8BA4\u77E5\u4F53\u611F\u51FA\u73B0\u53D8\u5316"] : [], mindCount >= 2 ? "\u5EFA\u8BAE\u8FDB\u4E00\u6B65\u8FDB\u884C\u7761\u7720\u3001\u538B\u529B\u3001\u60C5\u7EEA\u53CA\u8BA4\u77E5\u4E13\u9879\u8BC4\u4F30\u3002" : void 0),
    domain("gut", "\u80C3\u80A0\u4E0E\u6392\u4FBF\u72B6\u6001", gutCombination ? "evaluate" : levelFromCount(gutSignalCount), gutCombination ? ["\u6392\u4FBF\u3001\u8179\u80C0\u6216\u98DF\u7269\u76F8\u5173\u4E0D\u9002\u7EC4\u5408\u51FA\u73B0"] : [], gutCombination ? "\u53EF\u63D0\u9AD8\u80C3\u80A0\u4E0E\u80A0\u9053\u5FAE\u751F\u6001\u8BC4\u4F30\u4F18\u5148\u7EA7\uFF1B\u95EE\u5377\u672C\u8EAB\u4E0D\u5224\u65AD\u83CC\u7FA4\u72B6\u6001\u3002" : void 0),
    domain("metabolism", "\u4EE3\u8C22\u76F8\u5173\u4F53\u611F", metabolicSignals.length >= 2 ? "evaluate" : levelFromCount(metabolicSignals.length), metabolicSignals.length ? ["\u8179\u90E8\u3001\u9910\u540E\u4F53\u611F\u6216\u751F\u6D3B\u65B9\u5F0F\u4FE1\u53F7\u53E0\u52A0"] : [], metabolicSignals.length >= 2 ? "\u5EFA\u8BAE\u8FDB\u5165\u8840\u7CD6\u2014\u80F0\u5C9B\u7D20\u3001\u8840\u8102\u3001\u809D\u810F\u3001\u5C3F\u9178\u53CA\u4F53\u6210\u5206\u7B49\u4EE3\u8C22\u65B9\u5411\u8BC4\u4F30\u3002" : void 0),
    domain("cardio", "\u5FC3\u80BA\u4E0E\u8FD0\u52A8\u80FD\u529B", levelFromCount(cardioCount), cardioCount ? ["\u5FC3\u80BA\u8010\u529B\u6216\u5FC3\u8DF3\u4F53\u611F\u51FA\u73B0\u53D8\u5316"] : []),
    domain("muscle", "\u808C\u8089\u4E0E\u529F\u80FD\u50A8\u5907", muscleCount >= 2 ? "evaluate" : levelFromCount(muscleCount), muscleCount ? ["\u529B\u91CF\u3001\u6D3B\u52A8\u6216\u8FD0\u52A8\u6062\u590D\u51FA\u73B0\u53D8\u5316"] : [], muscleCount >= 2 ? "\u5EFA\u8BAE\u589E\u52A0\u4F53\u6210\u5206\u3001\u9AA8\u9ABC\u808C\u91CF\u3001\u63E1\u529B\u4E0E\u57FA\u7840\u8FD0\u52A8\u80FD\u529B\u8BC4\u4F30\u3002" : void 0),
    domain("maleUrology", "\u7537\u6027\u6D3B\u529B\u4E0E\u6CCC\u5C3F\u72B6\u6001", maleEvaluate ? "evaluate" : maleDeclines > 0 ? "signal" : "stable", maleEvaluate ? [urologyTrigger ? "\u5B58\u5728\u6CCC\u5C3F\u4E13\u9879\u8BC4\u4F30\u7EBF\u7D22" : "\u7537\u6027\u6D3B\u529B\u4E0E\u529F\u80FD\u50A8\u5907\u4F53\u611F\u540C\u65F6\u51FA\u73B0\u53D8\u5316"] : [], urologyTrigger ? "\u5EFA\u8BAE\u8FDB\u5165\u7537\u6027\u6CCC\u5C3F\u7CFB\u7EDF\u4E13\u9879\u8BC4\u4F30\uFF1B\u95EE\u5377\u4E0D\u76F4\u63A5\u5224\u65AD\u524D\u5217\u817A\u75BE\u75C5\u3002" : maleEvaluate ? "\u7537\u6027\u6D3B\u529B\u76F8\u5173\u4F53\u611F\u8F83\u65E2\u5F80\u51FA\u73B0\u53D8\u5316\uFF0C\u5EFA\u8BAE\u7ED3\u5408\u5E74\u9F84\u3001\u75C7\u72B6\u53CA\u4E34\u5E8A\u9700\u8981\u8BC4\u4F30\u7537\u6027\u6FC0\u7D20\u4E0E\u76F8\u5173\u5065\u5EB7\u56E0\u7D20\u3002" : void 0)
  ];
  if (redFlags.length) {
    domains = domains.map((item) => ({
      ...item,
      level: "clinical_priority",
      reasons: ["\u533B\u5B66\u5B89\u5168\u4FE1\u606F\u9700\u8981\u533B\u52A1\u4EBA\u5458\u4F18\u5148\u6838\u5B9E"],
      recommendation: "\u8BF7\u5148\u7531\u533B\u52A1\u4EBA\u5458\u5B8C\u6210\u4FE1\u606F\u6838\u5B9E\u4E0E\u98CE\u9669\u5224\u65AD\uFF0C\u518D\u51B3\u5B9A\u540E\u7EED\u5065\u5EB7\u7BA1\u7406\u8DEF\u5F84\u3002"
    }));
  }
  return { domains, hasRedFlag: redFlags.length > 0, redFlags };
}

// src/domain/questionnaire.ts
var scored = (labels) => labels.map((label, score2) => ({ value: String(score2), label, score: score2 }));
var frequency = scored(["\u4ECE\u4E0D", "\u5076\u5C14", "\u6709\u65F6", "\u7ECF\u5E38", "\u51E0\u4E4E\u6BCF\u5929"]);
var trend = scored(["\u660E\u663E\u53D8\u597D", "\u7565\u6709\u53D8\u597D", "\u57FA\u672C\u6CA1\u53D8\u5316", "\u7565\u6709\u4E0B\u964D", "\u660E\u663E\u4E0B\u964D"]);
var yesNo = [
  { value: "0", label: "\u5426", score: 0 },
  { value: "1", label: "\u662F", score: 1 }
];
var single = (number, prompt, options2 = frequency) => ({
  id: `q${number}`,
  number,
  prompt,
  type: "single",
  options: options2,
  required: true
});
var maleHealthV1 = {
  version: "male-health-v1.0",
  title: "\u5065\u5EB7\u4E0E\u529F\u80FD\u72B6\u6001\u95EE\u5377",
  audience: "40\u201455\u5C81\u7537\u6027\uFF0C\u4EE545\u5C81\u5DE6\u53F3\u4EBA\u7FA4\u4E3A\u6838\u5FC3",
  estimatedMinutes: "\u7EA66\u20148\u5206\u949F",
  sections: [
    {
      id: "identity",
      eyebrow: "\u5F00\u59CB\u4E4B\u524D",
      title: "\u57FA\u672C\u4FE1\u606F",
      description: "\u4FE1\u606F\u4EC5\u7528\u4E8E\u9662\u5185\u5065\u5EB7\u8BC4\u4F30\u4E0E\u8BB0\u5F55\u5339\u914D\u3002",
      questions: [
        { id: "name", prompt: "\u59D3\u540D", type: "text", required: true, placeholder: "\u8BF7\u8F93\u5165\u771F\u5B9E\u59D3\u540D" },
        { id: "age", prompt: "\u5E74\u9F84", type: "number", required: true, placeholder: "40\u201455" },
        { id: "phoneLast4", prompt: "\u624B\u673A\u53F7\u540E4\u4F4D", type: "text", required: true, placeholder: "\u4F8B\u5982 0826", helper: "\u4EC5\u7528\u4E8E\u533A\u5206\u540C\u540D\u5BA2\u6237\uFF0C\u4E0D\u6536\u96C6\u5B8C\u6574\u624B\u673A\u53F7\u3002" },
        { id: "date", prompt: "\u586B\u5199\u65E5\u671F", type: "date", required: true },
        { id: "workStatus", prompt: "\u804C\u4E1A\u72B6\u6001", type: "single", required: true, options: ["\u89C4\u5F8B\u65E5\u95F4\u5DE5\u4F5C", "\u7ECF\u5E38\u52A0\u73ED", "\u5012\u73ED\u6216\u591C\u73ED", "\u5DE5\u4F5C\u65F6\u95F4\u4E0D\u89C4\u5F8B", "\u81EA\u7531\u804C\u4E1A", "\u5176\u4ED6"].map((label, index) => ({ value: String(index), label })) },
        { id: "workStatusOther", prompt: "\u5176\u4ED6\u804C\u4E1A\u72B6\u6001", type: "text", placeholder: "\u5982\u9009\u62E9\u5176\u4ED6\uFF0C\u8BF7\u586B\u5199" },
        { id: "topConcerns", prompt: "\u5982\u679C\u53EA\u80FD\u4F18\u5148\u6539\u55843\u4E2A\u95EE\u9898\uFF0C\u60A8\u76EE\u524D\u6700\u5E0C\u671B\u6539\u5584\u7684\u662F", type: "multi", required: true, maxSelections: 3, options: ["\u7CBE\u529B\u4E0D\u8DB3", "\u7761\u7720", "\u4F53\u91CD\u6216\u8179\u90E8\u8102\u80AA", "\u6392\u4FBF\u6216\u80C3\u80A0\u4E0D\u9002", "\u538B\u529B\u4E0E\u60C5\u7EEA", "\u8BB0\u5FC6\u529B\u6216\u6CE8\u610F\u529B", "\u8FD0\u52A8\u80FD\u529B", "\u808C\u8089\u529B\u91CF", "\u8170\u80CC\u6216\u5173\u8282\u4E0D\u9002", "\u6027\u6B32\u6216\u6027\u529F\u80FD", "\u6392\u5C3F\u95EE\u9898", "\u996E\u9152\u540E\u7684\u8EAB\u4F53\u6062\u590D", "\u5176\u4ED6"].map((label, index) => ({ value: String(index), label })) },
        { id: "topConcernsOther", prompt: "\u5176\u4ED6\u5E0C\u671B\u6539\u5584\u7684\u95EE\u9898", type: "text", placeholder: "\u8BF7\u7B80\u8981\u586B\u5199" },
        { id: "mainChange", prompt: "\u6700\u8FD1\u534A\u5E74\uFF0C\u60A8\u81EA\u5DF1\u611F\u53D7\u6700\u660E\u663E\u7684\u4E00\u9879\u8EAB\u4F53\u53D8\u5316\u662F", type: "text", required: true, placeholder: "\u7528\u4E00\u4E24\u53E5\u8BDD\u63CF\u8FF0\u5373\u53EF" }
      ]
    },
    {
      id: "overall",
      eyebrow: "01 / \u6574\u4F53\u72B6\u6001",
      title: "\u6574\u4F53\u5065\u5EB7\u4E0E\u5E74\u9F84\u611F",
      description: "\u8BF7\u6839\u636E\u8FC7\u53BB4\u5468\u7684\u5B9E\u9645\u611F\u53D7\u9009\u62E9\u3002",
      questions: [
        single(1, "\u60A8\u5982\u4F55\u8BC4\u4EF7\u81EA\u5DF1\u76EE\u524D\u6574\u4F53\u8EAB\u4F53\u72B6\u6001\uFF1F", scored(["\u5F88\u597D", "\u8F83\u597D", "\u4E00\u822C", "\u8F83\u5DEE", "\u5F88\u5DEE"])),
        single(2, "\u4E0E2\u20143\u5E74\u524D\u76F8\u6BD4\uFF0C\u60A8\u7684\u6574\u4F53\u7CBE\u529B\u548C\u8EAB\u4F53\u72B6\u6001\uFF1A", trend),
        single(3, "\u4E0E\u5E74\u9F84\u76F8\u8FD1\u7684\u7537\u6027\u76F8\u6BD4\uFF0C\u60A8\u4E3B\u89C2\u611F\u89C9\u81EA\u5DF1\u7684\u8EAB\u4F53\u72B6\u6001\uFF1A", scored(["\u660E\u663E\u66F4\u5E74\u8F7B", "\u7565\u597D\u4E00\u4E9B", "\u57FA\u672C\u76F8\u5F53", "\u7565\u5DEE\u4E00\u4E9B", "\u660E\u663E\u66F4\u5DEE"]))
      ]
    },
    {
      id: "energy",
      eyebrow: "02 / \u6062\u590D\u529B",
      title: "\u7CBE\u529B\u3001\u75B2\u52B3\u4E0E\u6062\u590D",
      questions: [
        single(4, "\u65E9\u6668\u9192\u6765\u540E\u4ECD\u611F\u89C9\u8EAB\u4F53\u6CA1\u6709\u6062\u590D\u3001\u4F9D\u7136\u75B2\u52B3\u3002"),
        single(5, "\u767D\u5929\u5BB9\u6613\u51FA\u73B0\u6CA1\u6709\u660E\u663E\u539F\u56E0\u7684\u75B2\u52B3\u6216\u7CBE\u529B\u4E0D\u8DB3\u3002"),
        single(6, "\u5348\u996D\u540E\u5BB9\u6613\u660E\u663E\u72AF\u56F0\u3001\u7CBE\u795E\u4E0B\u964D\u6216\u5DE5\u4F5C\u6548\u7387\u964D\u4F4E\u3002"),
        single(7, "\u71AC\u591C\u3001\u5E94\u916C\u3001\u996E\u9152\u6216\u9AD8\u5F3A\u5EA6\u5DE5\u4F5C\u540E\uFF0C\u8EAB\u4F53\u901A\u5E38\u9700\u8981\u8D85\u8FC71\u5929\u624D\u80FD\u6062\u590D\u3002"),
        single(8, "\u4E0E\u8FC7\u53BB\u76F8\u6BD4\uFF0C\u6301\u7EED\u5DE5\u4F5C\u3001\u8FD0\u52A8\u6216\u53C2\u52A0\u793E\u4EA4\u6D3B\u52A8\u65F6\u66F4\u5BB9\u6613\u611F\u89C9\u201C\u6491\u4E0D\u4F4F\u201D\u3002")
      ]
    },
    {
      id: "sleep",
      eyebrow: "03 / \u7761\u7720",
      title: "\u7761\u7720\u4E0E\u65E5\u95F4\u72B6\u6001",
      questions: [
        single(9, "\u8FC7\u53BB4\u5468\u5E73\u5747\u6BCF\u665A\u5B9E\u9645\u7761\u7720\u65F6\u95F4\uFF1A", scored(["\u22657\u5C0F\u65F6", "6\u20147\u5C0F\u65F6", "5\u20146\u5C0F\u65F6", "4\u20145\u5C0F\u65F6", "\uFF1C4\u5C0F\u65F6"])),
        single(10, "\u8EBA\u4E0B\u540E\u8F83\u957F\u65F6\u95F4\u4ECD\u65E0\u6CD5\u5165\u7761\u3002"),
        single(11, "\u591C\u95F4\u5BB9\u6613\u9192\u6765\uFF0C\u6216\u9192\u6765\u540E\u96BE\u4EE5\u518D\u6B21\u5165\u7761\u3002"),
        single(12, "\u662F\u5426\u5B58\u5728\u660E\u663E\u6253\u9F3E\uFF0C\u6216\u5BB6\u4EBA\u66FE\u53D1\u73B0\u7761\u7720\u4E2D\u6709\u547C\u5438\u6682\u505C\u3001\u618B\u6C14\u73B0\u8C61\uFF1F", scored(["\u4ECE\u65E0", "\u5076\u5C14\u6253\u9F3E", "\u7ECF\u5E38\u6253\u9F3E", "\u6253\u9F3E\u975E\u5E38\u660E\u663E", "\u5BB6\u4EBA\u89C2\u5BDF\u5230\u547C\u5438\u6682\u505C\u6216\u618B\u6C14"])),
        single(13, "\u767D\u5929\u5750\u7740\u3001\u5F00\u4F1A\u3001\u770B\u7535\u89C6\u6216\u4E58\u8F66\u65F6\u5BB9\u6613\u6253\u778C\u7761\u3002"),
        single(14, "\u5DE5\u4F5C\u65E5\u7761\u7720\u4E0D\u8DB3\uFF0C\u9700\u8981\u5728\u5468\u672B\u660E\u663E\u8865\u89C9\u624D\u80FD\u6062\u590D\u3002")
      ]
    },
    {
      id: "mind",
      eyebrow: "04 / \u5FC3\u667A",
      title: "\u538B\u529B\u3001\u60C5\u7EEA\u4E0E\u8BA4\u77E5\u72B6\u6001",
      questions: [
        single(15, "\u6700\u8FD1\u5BB9\u6613\u70E6\u8E81\u3001\u8010\u5FC3\u4E0B\u964D\u6216\u6BD4\u4EE5\u524D\u66F4\u5BB9\u6613\u53D1\u813E\u6C14\u3002"),
        single(16, "\u5373\u4F7F\u5DF2\u7ECF\u4E0B\u73ED\u6216\u4F11\u606F\uFF0C\u8111\u5B50\u4ECD\u505C\u4E0D\u4E0B\u6765\uFF0C\u5F88\u96BE\u771F\u6B63\u653E\u677E\u3002"),
        single(17, "\u5DE5\u4F5C\u3001\u9605\u8BFB\u6216\u4EA4\u6D41\u65F6\uFF0C\u6BD4\u4EE5\u524D\u66F4\u5BB9\u6613\u6CE8\u610F\u529B\u4E0D\u96C6\u4E2D\u3002"),
        single(18, "\u6700\u8FD1\u611F\u89C9\u8BB0\u5FC6\u529B\u4E0B\u964D\u3001\u5BB9\u6613\u5FD8\u4E8B\u3001\u53CD\u5E94\u53D8\u6162\u6216\u51FA\u73B0\u660E\u663E\u201C\u8111\u5B50\u53D1\u6728\u201D\u7684\u611F\u89C9\u3002"),
        single(19, "\u5BF9\u8FC7\u53BB\u611F\u5174\u8DA3\u7684\u5DE5\u4F5C\u3001\u8FD0\u52A8\u3001\u793E\u4EA4\u6216\u5176\u4ED6\u4E8B\u60C5\uFF0C\u5174\u8DA3\u548C\u4E3B\u52A8\u6027\u4E0B\u964D\u3002")
      ]
    },
    {
      id: "gut",
      eyebrow: "05 / \u6D88\u5316",
      title: "\u80C3\u80A0\u4E0E\u6392\u4FBF\u4F53\u9A8C",
      questions: [
        single(20, "\u60A8\u901A\u5E38\u7684\u6392\u4FBF\u9891\u7387\uFF1A", scored(["\u6BCF\u59291\u20142\u6B21", "\u5927\u591A\u6570\u6BCF\u59291\u6B21", "\u7EA6\u6BCF2\u59291\u6B21", "\u6BCF\u5468\u5C11\u4E8E3\u6B21", "\u6BCF\u5929\u22653\u6B21\u6216\u660E\u663E\u4E0D\u89C4\u5F8B"])),
        single(21, "\u6392\u4FBF\u65F6\u7ECF\u5E38\u8D39\u529B\u3001\u5927\u4FBF\u504F\u786C\u6216\u6709\u6392\u4E0D\u5E72\u51C0\u7684\u611F\u89C9\u3002"),
        single(22, "\u7ECF\u5E38\u51FA\u73B0\u5927\u4FBF\u504F\u7A00\u3001\u7A81\u7136\u4FBF\u610F\u6216\u6765\u4E0D\u53CA\u6392\u4FBF\u7684\u60C5\u51B5\u3002"),
        single(23, "\u996D\u540E\u6216\u4E00\u5929\u4E2D\u7ECF\u5E38\u51FA\u73B0\u8179\u80C0\u3001\u6392\u6C14\u660E\u663E\u589E\u591A\u3002"),
        single(24, "\u7ECF\u5E38\u51FA\u73B0\u8179\u90E8\u4E0D\u8212\u670D\u3001\u9690\u75DB\u3001\u53CD\u9178\u3001\u70E7\u5FC3\u6216\u80C3\u90E8\u80C0\u6EE1\u3002"),
        single(25, "\u5403\u67D0\u4E9B\u98DF\u7269\u540E\u5BB9\u6613\u51FA\u73B0\u8179\u80C0\u3001\u8179\u6CFB\u3001\u8179\u75DB\u3001\u53CD\u9178\u6216\u660E\u663E\u4E0D\u8212\u670D\u3002", scored(["\u4ECE\u65E0", "\u5076\u5C14", "\u6709\uFF0C\u4F46\u6CA1\u6709\u660E\u786E\u98DF\u7269", "\u6709\u6BD4\u8F83\u660E\u786E\u7684\u98DF\u7269", "\u591A\u7C7B\u98DF\u7269\u90FD\u4F1A\u5F15\u8D77\u4E0D\u9002"])),
        { id: "q25Food", prompt: "\u5982\u6709\u660E\u786E\u98DF\u7269\uFF0C\u8BF7\u586B\u5199", type: "text", placeholder: "\u4F8B\u5982\u5976\u5236\u54C1\u3001\u8F9B\u8FA3\u98DF\u7269" }
      ]
    },
    {
      id: "metabolism",
      eyebrow: "06 / \u4EE3\u8C22",
      title: "\u98DF\u6B32\u3001\u8179\u90E8\u53D8\u5316\u4E0E\u4EE3\u8C22\u4F53\u611F",
      questions: [
        single(26, "\u4E0E2\u20143\u5E74\u524D\u76F8\u6BD4\uFF0C\u8179\u90E8\u66F4\u5BB9\u6613\u957F\u8089\u3001\u8170\u5E26\u53D8\u7D27\u6216\u809A\u5B50\u660E\u663E\u589E\u5927\u3002", scored(["\u660E\u663E\u6539\u5584", "\u7565\u6709\u6539\u5584", "\u57FA\u672C\u6CA1\u53D8\u5316", "\u7565\u6709\u589E\u52A0", "\u660E\u663E\u589E\u52A0"])),
        single(27, "\u5403\u5B8C\u4E3B\u98DF\u3001\u751C\u98DF\u6216\u8F83\u4E30\u76DB\u7684\u4E00\u9910\u540E\u5BB9\u6613\u660E\u663E\u72AF\u56F0\u3002"),
        single(28, "\u7ECF\u5E38\u5BB9\u6613\u997F\u3001\u60F3\u5403\u751C\u98DF\u3001\u96F6\u98DF\uFF0C\u6216\u8005\u665A\u4E0A\u7279\u522B\u60F3\u5403\u4E1C\u897F\u3002"),
        single(29, "\u4E0E\u8FC7\u53BB\u76F8\u6BD4\uFF0C\u5373\u4F7F\u996E\u98DF\u53D8\u5316\u4E0D\u5927\uFF0C\u4F53\u91CD\u6216\u8170\u56F4\u4E5F\u6BD4\u4EE5\u524D\u66F4\u96BE\u63A7\u5236\u3002")
      ]
    },
    {
      id: "movement",
      eyebrow: "07 / \u529F\u80FD\u50A8\u5907",
      title: "\u5FC3\u80BA\u8010\u529B\u3001\u8FD0\u52A8\u4E0E\u808C\u8089\u72B6\u6001",
      questions: [
        single(30, "\u4E0E2\u20143\u5E74\u524D\u76F8\u6BD4\uFF0C\u4E0A\u4E24\u5C42\u697C\u3001\u5FEB\u8D70\u6216\u77ED\u8DDD\u79BB\u722C\u5761\u65F6\u66F4\u5BB9\u6613\u6C14\u5598\u6216\u75B2\u52B3\u3002", trend),
        single(31, "\u65E5\u5E38\u751F\u6D3B\u4E2D\u4F1A\u51FA\u73B0\u660E\u663E\u5FC3\u614C\u3001\u5FC3\u8DF3\u4E0D\u89C4\u5F8B\u6216\u7A81\u7136\u611F\u89C9\u5FC3\u8DF3\u5F88\u5FEB\u3002"),
        single(32, "\u4E0E\u8FC7\u53BB\u76F8\u6BD4\uFF0C\u642C\u4E1C\u897F\u3001\u63D0\u91CD\u7269\u3001\u6DF1\u8E72\u8D77\u7ACB\u7B49\u52A8\u4F5C\u65F6\u611F\u89C9\u529B\u91CF\u4E0B\u964D\u3002", trend),
        single(33, "\u540C\u6837\u5F3A\u5EA6\u7684\u8FD0\u52A8\u540E\uFF0C\u73B0\u5728\u6BD4\u4EE5\u524D\u66F4\u5BB9\u6613\u9178\u75DB\u3001\u75B2\u52B3\u6216\u6062\u590D\u65F6\u95F4\u5EF6\u957F\u3002"),
        single(34, "\u8170\u3001\u80CC\u3001\u80A9\u9888\u3001\u819D\u5173\u8282\u6216\u5176\u4ED6\u808C\u9AA8\u4E0D\u9002\u5DF2\u7ECF\u5F71\u54CD\u8FD0\u52A8\u6216\u65E5\u5E38\u6D3B\u52A8\u3002")
      ]
    },
    {
      id: "maleHealth",
      eyebrow: "08 / \u7537\u6027\u5065\u5EB7",
      title: "\u7537\u6027\u6D3B\u529B\u3001\u6027\u5065\u5EB7\u4E0E\u6392\u5C3F\u72B6\u6001",
      description: "\u4EE5\u4E0B\u5C5E\u4E8E\u7537\u6027\u5065\u5EB7\u5E38\u89C4\u5185\u5BB9\uFF0C\u7528\u4E8E\u5224\u65AD\u662F\u5426\u9700\u8981\u8FDB\u4E00\u6B65\u8BC4\u4F30\u3002",
      questions: [
        single(35, "\u4E0E2\u20143\u5E74\u524D\u76F8\u6BD4\uFF0C\u6027\u6B32\u6709\u6240\u4E0B\u964D\u3002", scored(["\u660E\u663E\u589E\u52A0", "\u7565\u6709\u589E\u52A0", "\u57FA\u672C\u6CA1\u53D8\u5316", "\u7565\u6709\u4E0B\u964D", "\u660E\u663E\u4E0B\u964D"])),
        single(36, "\u4E0E\u8FC7\u53BB\u76F8\u6BD4\uFF0C\u6668\u8D77\u81EA\u7136\u52C3\u8D77\u7684\u9891\u7387\u660E\u663E\u51CF\u5C11\u3002", scored(["\u660E\u663E\u589E\u52A0", "\u7565\u6709\u589E\u52A0", "\u57FA\u672C\u6CA1\u53D8\u5316", "\u7565\u6709\u4E0B\u964D", "\u660E\u663E\u4E0B\u964D"])),
        single(37, "\u4E0E\u8FC7\u53BB\u76F8\u6BD4\uFF0C\u52C3\u8D77\u786C\u5EA6\u3001\u7EF4\u6301\u65F6\u95F4\u6216\u6027\u751F\u6D3B\u6EE1\u610F\u5EA6\u6709\u6240\u4E0B\u964D\u3002", trend),
        single(38, "\u591C\u95F4\u9700\u8981\u8D77\u5E8A\u6392\u5C3F\uFF1A", scored(["\u65E0", "\u901A\u5E381\u6B21", "\u901A\u5E382\u6B21", "\u901A\u5E383\u6B21", "\u22654\u6B21"])),
        single(39, "\u6392\u5C3F\u65F6\u51FA\u73B0\u7B49\u5F85\u3001\u5C3F\u7EBF\u53D8\u7EC6\u3001\u65AD\u65AD\u7EED\u7EED\u6216\u9700\u8981\u7528\u529B\u3002"),
        single(40, "\u6392\u5C3F\u540E\u4ECD\u611F\u89C9\u6CA1\u6709\u6392\u5E72\u51C0\uFF0C\u6216\u7ECF\u5E38\u7A81\u7136\u51FA\u73B0\u660E\u663E\u5C3F\u610F\u3002")
      ]
    },
    {
      id: "lifestyle",
      eyebrow: "09 / \u9A71\u52A8\u56E0\u7D20",
      title: "\u751F\u6D3B\u65B9\u5F0F\u4E0E\u5065\u5EB7\u9A71\u52A8\u56E0\u7D20",
      questions: [
        single(41, "\u5E73\u5747\u6BCF\u5929\u5750\u7740\u4E0D\u6D3B\u52A8\u7684\u65F6\u95F4\u7EA6\u4E3A\uFF1A", scored(["\uFF1C4\u5C0F\u65F6", "4\u20146\u5C0F\u65F6", "6\u20148\u5C0F\u65F6", "8\u201410\u5C0F\u65F6", "\uFF1E10\u5C0F\u65F6"])),
        single(42, "\u8FC7\u53BB4\u5468\uFF0C\u6BCF\u5468\u8FDB\u884C\u4E2D\u7B49\u53CA\u4EE5\u4E0A\u5F3A\u5EA6\u8FD0\u52A8\uFF1A", scored(["\u22655\u5929", "3\u20144\u5929", "2\u5929", "1\u5929", "\u57FA\u672C\u6CA1\u6709"])),
        single(43, "\u8FC7\u53BB4\u5468\uFF0C\u6BCF\u5468\u8FDB\u884C\u529B\u91CF\u6216\u6297\u963B\u8BAD\u7EC3\uFF1A", scored(["\u22653\u6B21", "2\u6B21", "1\u6B21", "\u5076\u5C14", "\u57FA\u672C\u6CA1\u6709"])),
        single(44, "\u60A8\u76EE\u524D\u996E\u9152\u60C5\u51B5\uFF1A", scored(["\u57FA\u672C\u4E0D\u996E\u9152", "\u6BCF\u67081\u20143\u6B21", "\u6BCF\u54681\u20142\u6B21", "\u6BCF\u54683\u20144\u6B21", "\u6BCF\u5468\u22655\u6B21\u6216\u7ECF\u5E38\u4E00\u6B21\u559D\u8F83\u591A"])),
        { id: "q44Drink", prompt: "\u6700\u5E38\u996E\u7528", type: "text", placeholder: "\u4F8B\u5982\u767D\u9152\u3001\u5564\u9152\u3001\u7EA2\u9152" },
        single(45, "\u60A8\u76EE\u524D\u5438\u70DF\u60C5\u51B5\uFF1A", scored(["\u4ECE\u4E0D\u5438\u70DF", "\u5DF2\u6212\u70DF", "\u5076\u5C14\u5438", "\u6BCF\u5929\u5438\u70DF\u4F46\uFF1C10\u652F", "\u6BCF\u5929\u226510\u652F"])),
        single(46, "\u665A\u9910\u8FC7\u665A\u3001\u591C\u5BB5\u3001\u5E94\u916C\u6216\u7761\u524D3\u5C0F\u65F6\u5185\u5927\u91CF\u8FDB\u98DF\u3002"),
        single(47, "\u4EE5\u4E0B\u4E94\u7C7B\u98DF\u7269\u6709\u51E0\u7C7B\u80FD\u591F\u7A33\u5B9A\u6BCF\u5468\u6444\u5165\uFF1A\u852C\u83DC\u3001\u6C34\u679C\u3001\u5168\u8C37\u7269/\u6742\u7CAE\u3001\u8C46\u7C7B/\u8C46\u5236\u54C1\u3001\u575A\u679C/\u79CD\u5B50\u3002", scored(["\u4E94\u7C7B\u5747\u8F83\u89C4\u5F8B", "\u56DB\u7C7B", "\u4E09\u7C7B", "\u4E00\u81F3\u4E24\u7C7B", "\u57FA\u672C\u7F3A\u5C11\u4E0A\u8FF0\u98DF\u7269"])),
        { id: "q48", number: 48, prompt: "\u8FD13\u4E2A\u6708\u662F\u5426\u4F7F\u7528\u8FC7\u4EE5\u4E0B\u4EA7\u54C1\u6216\u836F\u7269\uFF1F", type: "multi", required: true, options: ["\u6297\u751F\u7D20", "\u6CFB\u836F", "\u6291\u9178\u836F", "\u76CA\u751F\u83CC", "\u76CA\u751F\u5143", "\u86CB\u767D\u7C89", "\u51CF\u91CD\u836F\u7269", "\u7761\u7720\u836F\u7269", "\u6FC0\u7D20\u76F8\u5173\u836F\u7269", "\u5176\u4ED6\u8425\u517B\u8865\u5145\u5242", "\u5747\u65E0"].map((label, index) => ({ value: String(index), label })) },
        { id: "q48Details", prompt: "\u5982\u6709\uFF0C\u8BF7\u586B\u5199\u540D\u79F0\u53CA\u5927\u81F4\u4F7F\u7528\u65F6\u95F4", type: "text", placeholder: "\u540D\u79F0\u53CA\u4F7F\u7528\u65F6\u95F4" }
      ]
    },
    {
      id: "safety",
      eyebrow: "10 / \u533B\u5B66\u5B89\u5168",
      title: "\u533B\u5B66\u5B89\u5168\u4FE1\u606F",
      description: "\u4EE5\u4E0B\u95EE\u9898\u4E0D\u7528\u4E8E\u8BA1\u7B97\u5065\u5EB7\u8BC4\u5206\u3002\u5982\u56DE\u7B54\u201C\u662F\u201D\uFF0C\u5EFA\u8BAE\u7531\u533B\u52A1\u4EBA\u5458\u8FDB\u4E00\u6B65\u4E86\u89E3\u60C5\u51B5\u3002",
      questions: [
        single(49, "\u8FC7\u53BB3\u4E2A\u6708\uFF0C\u6D3B\u52A8\u65F6\u6216\u4F11\u606F\u65F6\u51FA\u73B0\u660E\u663E\u80F8\u75DB\u3001\u80F8\u95F7\u6216\u80F8\u90E8\u538B\u8FEB\u611F\uFF1F", yesNo),
        single(50, "\u8FC7\u53BB3\u4E2A\u6708\uFF0C\u51FA\u73B0\u6655\u53A5\u3001\u63A5\u8FD1\u6655\u53A5\u6216\u7A81\u7136\u5931\u53BB\u610F\u8BC6\uFF1F", yesNo),
        single(51, "\u8FC7\u53BB3\u4E2A\u6708\uFF0C\u51FA\u73B0\u539F\u56E0\u4E0D\u660E\u4E14\u6301\u7EED\u52A0\u91CD\u7684\u547C\u5438\u56F0\u96BE\uFF1F", yesNo),
        single(52, "\u8FC7\u53BB3\u4E2A\u6708\uFF0C\u51FA\u73B0\u4FBF\u8840\u3001\u9ED1\u4FBF\u6216\u8089\u773C\u8840\u5C3F\uFF1F", yesNo),
        single(53, "\u975E\u4E3B\u52A8\u51CF\u91CD\u60C5\u51B5\u4E0B\u51FA\u73B0\u660E\u663E\u4F53\u91CD\u4E0B\u964D\uFF0C\u6216\u6301\u7EED\u660E\u663E\u98DF\u6B32\u4E0B\u964D\uFF1F", yesNo),
        single(54, "\u6301\u7EED\u6216\u53CD\u590D\u51FA\u73B0\u6BD4\u8F83\u660E\u663E\u7684\u8179\u75DB\uFF1F", yesNo),
        single(55, "\u8FD1\u671F\u6301\u7EED\u660E\u663E\u60C5\u7EEA\u4F4E\u843D\u3001\u7EDD\u671B\uFF0C\u6216\u51FA\u73B0\u4F24\u5BB3\u81EA\u5DF1\u7684\u60F3\u6CD5\uFF1F", yesNo)
      ]
    },
    {
      id: "goals",
      eyebrow: "11 / \u884C\u52A8\u610F\u613F",
      title: "\u4E2A\u4EBA\u5065\u5EB7\u76EE\u6807",
      questions: [
        { id: "twelveWeekGoals", prompt: "\u8BF7\u9009\u62E9\u672A\u676512\u5468\u6700\u613F\u610F\u5B9E\u9645\u6539\u53D8\u76843\u4EF6\u4E8B\u60C5", type: "multi", required: true, maxSelections: 3, options: ["\u6539\u5584\u7761\u7720", "\u51CF\u5C11\u75B2\u52B3", "\u51CF\u5C11\u8179\u90E8\u8102\u80AA", "\u6539\u5584\u6392\u4FBF", "\u51CF\u5C11\u8179\u80C0", "\u589E\u52A0\u8FD0\u52A8", "\u589E\u52A0\u529B\u91CF\u8BAD\u7EC3", "\u51CF\u5C11\u996E\u9152", "\u6539\u5584\u996E\u98DF\u7ED3\u6784", "\u7BA1\u7406\u538B\u529B", "\u6539\u5584\u7537\u6027\u6D3B\u529B", "\u6539\u5584\u6392\u5C3F", "\u63D0\u9AD8\u6CE8\u610F\u529B\u548C\u5DE5\u4F5C\u6548\u7387", "\u5176\u4ED6"].map((label, index) => ({ value: String(index), label })) },
        { id: "twelveWeekGoalsOther", prompt: "\u5176\u4ED6\u76EE\u6807", type: "text", placeholder: "\u8BF7\u586B\u5199" },
        { id: "singleImprovement", prompt: "\u5982\u679C\u672A\u676512\u5468\u53EA\u80FD\u770B\u5230\u4E00\u4E2A\u660E\u663E\u6539\u5584\uFF0C\u60A8\u6700\u5E0C\u671B\u662F\u4EC0\u4E48\uFF1F", type: "text", required: true, placeholder: "\u5199\u4E0B\u6700\u91CD\u8981\u7684\u4E00\u4E2A\u53D8\u5316" }
      ]
    }
  ]
};

// src/domain/validation.ts
var isEmpty = (value) => value === void 0 || value === "" || Array.isArray(value) && value.length === 0;
var questionById = new Map(
  maleHealthV1.sections.flatMap((section) => section.questions).map((question) => [question.id, question])
);
function validateQuestions(questionIds, answers) {
  const errors = {};
  for (const questionId of questionIds) {
    const question = questionById.get(questionId);
    if (!question) {
      errors[questionId] = "\u95EE\u5377\u9898\u76EE\u4E0D\u5B58\u5728";
      continue;
    }
    const value = answers[question.id];
    if (question.required && isEmpty(value)) {
      errors[question.id] = question.type === "text" || question.type === "number" || question.type === "date" ? "\u8BF7\u586B\u5199\u6B64\u9879" : "\u8BF7\u9009\u62E9\u4E00\u9879";
      continue;
    }
    if (question.maxSelections && Array.isArray(value) && value.length > question.maxSelections) {
      errors[question.id] = `\u6700\u591A\u9009\u62E9${question.maxSelections}\u9879`;
    }
  }
  const name = String(answers.name ?? "").trim();
  const age = Number(answers.age);
  const phoneLast4 = String(answers.phoneLast4 ?? "");
  if (questionIds.includes("name") && !name) errors.name = "\u8BF7\u586B\u5199\u59D3\u540D";
  if (questionIds.includes("age") && (!Number.isInteger(age) || age < 40 || age > 55)) errors.age = "\u8BF7\u8F93\u516540\u201455\u4E4B\u95F4\u7684\u6574\u6570\u5E74\u9F84";
  if (questionIds.includes("phoneLast4") && !/^\d{4}$/.test(phoneLast4)) errors.phoneLast4 = "\u8BF7\u8F93\u5165\u624B\u673A\u53F7\u540E4\u4F4D\u6570\u5B57";
  return errors;
}
function validateStep(sectionId, answers) {
  const section = maleHealthV1.sections.find((item) => item.id === sectionId);
  if (!section) return { _section: "\u95EE\u5377\u6B65\u9AA4\u4E0D\u5B58\u5728" };
  return validateQuestions(section.questions.map(({ id }) => id), answers);
}

// src/hospital/surveyDefinition.ts
var legacyQuestions = new Map(
  maleHealthV1.sections.flatMap((section) => section.questions).map((question) => [question.id, question])
);
var cloneLegacy = (id, overrides = {}) => {
  const question = legacyQuestions.get(id);
  if (!question) throw new Error(`\u7F3A\u5C11\u65E2\u6709\u9898\u76EE\uFF1A${id}`);
  return { ...question, ...overrides, options: overrides.options ?? question.options };
};
var options = (labels) => labels.map((label, index) => ({ value: String(index), label }));
var hospitalModules = [
  { id: "identity", index: 1, title: "\u57FA\u672C\u4FE1\u606F", introTitle: "\u5148\u4ECE\u57FA\u672C\u4FE1\u606F\u5F00\u59CB", introDescription: "\u53EA\u9700\u586B\u5199\u59D3\u540D\u4E0E\u624B\u673A\u53F7\uFF0C\u65E5\u671F\u5C06\u7531\u7CFB\u7EDF\u81EA\u52A8\u8BB0\u5F55\u3002" },
  { id: "overall", index: 2, title: "\u5F53\u524D\u5173\u6CE8\u4E0E\u6574\u4F53\u72B6\u6001", introTitle: "\u5148\u4E86\u89E3\u60A8\u6700\u5173\u6CE8\u7684\u53D8\u5316", introDescription: "\u8FD9\u4E9B\u9009\u62E9\u5C06\u5E2E\u52A9\u5065\u5EB7\u7BA1\u7406\u5E08\u786E\u5B9A\u540E\u7EED\u6C9F\u901A\u91CD\u70B9\u3002" },
  { id: "energy", index: 3, title: "\u7CBE\u529B\u4E0E\u6062\u590D", introTitle: "\u63A5\u4E0B\u6765\u4E86\u89E3\u60A8\u7684\u7CBE\u529B\u4E0E\u6062\u590D", introDescription: "\u8BF7\u6839\u636E\u8FC7\u53BB4\u5468\u7684\u771F\u5B9E\u611F\u53D7\u9009\u62E9\u3002" },
  { id: "sleep", index: 4, title: "\u7761\u7720\u4E0E\u65E5\u95F4\u72B6\u6001", introTitle: "\u63A5\u4E0B\u6765\u4E86\u89E3\u60A8\u7684\u7761\u7720\u72B6\u6001", introDescription: "\u7761\u7720\u4E0E\u7CBE\u529B\u3001\u4EE3\u8C22\u3001\u6062\u590D\u548C\u65E5\u95F4\u529F\u80FD\u5BC6\u5207\u76F8\u5173\u3002" },
  { id: "mind", index: 5, title: "\u538B\u529B\u4E0E\u8BA4\u77E5", introTitle: "\u63A5\u4E0B\u6765\u4E86\u89E3\u538B\u529B\u4E0E\u8BA4\u77E5\u72B6\u6001", introDescription: "\u8BF7\u56DE\u60F3\u8FC7\u53BB4\u5468\u5DE5\u4F5C\u3001\u4F11\u606F\u4E0E\u4EA4\u6D41\u65F6\u7684\u72B6\u6001\u3002" },
  { id: "gut", index: 6, title: "\u80C3\u80A0\u4E0E\u6392\u4FBF", introTitle: "\u63A5\u4E0B\u6765\u4E86\u89E3\u80C3\u80A0\u4E0E\u6392\u4FBF", introDescription: "\u8FD9\u4E9B\u4F53\u9A8C\u4F1A\u4E0E\u540E\u7EED\u5FAE\u751F\u6001\u68C0\u6D4B\u6570\u636E\u4E00\u8D77\u7EFC\u5408\u5206\u6790\u3002" },
  { id: "metabolism", index: 7, title: "\u4EE3\u8C22\u4E0E\u4F53\u91CD", introTitle: "\u63A5\u4E0B\u6765\u4E86\u89E3\u4EE3\u8C22\u4E0E\u4F53\u91CD\u53D8\u5316", introDescription: "\u53EA\u9700\u6839\u636E\u65E5\u5E38\u4F53\u611F\u4F5C\u7B54\uFF0C\u4E0D\u9700\u8981\u53C2\u8003\u4F53\u68C0\u7ED3\u679C\u3002" },
  { id: "movement", index: 8, title: "\u5FC3\u80BA\u3001\u8FD0\u52A8\u4E0E\u808C\u8089", introTitle: "\u63A5\u4E0B\u6765\u4E86\u89E3\u8EAB\u4F53\u529F\u80FD\u50A8\u5907", introDescription: "\u8BF7\u6BD4\u8F83\u8FD1\u671F\u6D3B\u52A8\u3001\u529B\u91CF\u4E0E\u8FD0\u52A8\u6062\u590D\u72B6\u6001\u3002" },
  { id: "male", index: 9, title: "\u7537\u6027\u6D3B\u529B\u4E0E\u6392\u5C3F", introTitle: "\u7537\u6027\u6D3B\u529B\u4E0E\u6392\u5C3F\u72B6\u6001", introDescription: "\u4EE5\u4E0B\u5C5E\u4E8E\u7537\u6027\u5065\u5EB7\u5E38\u89C4\u8BC4\u4F30\u4FE1\u606F\uFF0C\u4EC5\u7528\u4E8E\u7EFC\u5408\u5065\u5EB7\u72B6\u6001\u5206\u6790\u3002" },
  { id: "lifestyle", index: 10, title: "\u751F\u6D3B\u65B9\u5F0F\u4E0E\u533B\u5B66\u5B89\u5168", introTitle: "\u6700\u540E\u4E86\u89E3\u751F\u6D3B\u65B9\u5F0F\u4E0E\u5B89\u5168\u4FE1\u606F", introDescription: "\u8FD9\u90E8\u5206\u5C06\u5E2E\u52A9\u6211\u4EEC\u5B89\u6392\u540E\u7EED\u5065\u5EB7\u7BA1\u7406\u4E0E\u4EBA\u5DE5\u786E\u8BA4\u3002" }
];
var intro = (module2) => ({
  id: `intro:${module2.id}`,
  kind: "intro",
  moduleId: module2.id,
  title: module2.introTitle,
  description: module2.introDescription,
  tone: module2.tone,
  autoAdvanceMs: 780
});
var page = (moduleId, question) => ({ id: question.id, kind: "question", moduleId, question });
var regular = (moduleId, from, to) => Array.from({ length: to - from + 1 }, (_, index) => page(moduleId, cloneLegacy(`q${from + index}`, { autoAdvance: true, subtitle: "\u8BF7\u6839\u636E\u8FC7\u53BB4\u5468\u5B9E\u9645\u60C5\u51B5\u9009\u62E9" })));
var topConcernOptions = options([
  "\u7CBE\u529B\u4E0D\u8DB3",
  "\u7761\u7720",
  "\u4F53\u91CD\u6216\u8179\u90E8\u8102\u80AA",
  "\u6392\u4FBF\u6216\u80C3\u80A0\u4E0D\u9002",
  "\u538B\u529B\u4E0E\u60C5\u7EEA",
  "\u8BB0\u5FC6\u529B\u6216\u6CE8\u610F\u529B",
  "\u8FD0\u52A8\u80FD\u529B",
  "\u808C\u8089\u529B\u91CF",
  "\u8170\u80CC\u6216\u5173\u8282\u4E0D\u9002",
  "\u7537\u6027\u6D3B\u529B",
  "\u6392\u5C3F\u95EE\u9898",
  "\u996E\u9152\u540E\u7684\u8EAB\u4F53\u6062\u590D"
]);
var pages = [];
for (const module2 of hospitalModules) {
  pages.push(intro(module2));
  if (module2.id === "identity") {
    pages.push(
      page("identity", { id: "name", prompt: "\u8BF7\u95EE\u60A8\u7684\u59D3\u540D\u662F\uFF1F", subtitle: "\u7528\u4E8E\u9662\u5185\u5065\u5EB7\u8BB0\u5F55\u5339\u914D", type: "text", required: true, placeholder: "\u8BF7\u8F93\u5165\u771F\u5B9E\u59D3\u540D", autocomplete: "name" }),
      page("identity", { id: "phone", prompt: "\u8BF7\u586B\u5199\u60A8\u7684\u624B\u673A\u53F7\u7801", subtitle: "\u7528\u4E8E\u8BB0\u5F55\u67E5\u8BE2\u4E0E\u533B\u52A1\u4EBA\u5458\u540E\u7EED\u8054\u7CFB", type: "phone", required: true, placeholder: "\u8BF7\u8F93\u516511\u4F4D\u624B\u673A\u53F7", autocomplete: "tel" })
    );
  }
  if (module2.id === "overall") {
    pages.push(
      page("overall", { id: "topConcerns", prompt: "\u76EE\u524D\u6700\u5E0C\u671B\u4F18\u5148\u6539\u5584\u54EA\u4E9B\u95EE\u9898\uFF1F", subtitle: "\u8BF7\u9009\u62E93\u9879", type: "multi", required: true, minSelections: 3, maxSelections: 3, layout: "grid", options: topConcernOptions }),
      page("overall", { id: "mainChange", prompt: "\u6700\u8FD1\u534A\u5E74\uFF0C\u60A8\u611F\u53D7\u6700\u660E\u663E\u7684\u8EAB\u4F53\u53D8\u5316\u662F\uFF1F", type: "single", required: true, autoAdvance: true, options: options(["\u7CBE\u529B\u4E0B\u964D", "\u7761\u7720\u53D8\u5DEE", "\u8179\u90E8\u66F4\u5BB9\u6613\u957F\u8089", "\u80C3\u80A0\u6216\u6392\u4FBF\u53D8\u5316", "\u538B\u529B\u6216\u60C5\u7EEA\u53D8\u5316", "\u6CE8\u610F\u529B\u6216\u8BB0\u5FC6\u4E0B\u964D", "\u8FD0\u52A8\u80FD\u529B\u4E0B\u964D", "\u529B\u91CF\u4E0B\u964D", "\u8170\u80CC\u6216\u5173\u8282\u4E0D\u9002", "\u7537\u6027\u6D3B\u529B\u4E0B\u964D", "\u6392\u5C3F\u53D8\u5316", "\u6CA1\u6709\u660E\u663E\u53D8\u5316"]) }),
      ...regular("overall", 1, 3)
    );
  }
  if (module2.id === "energy") pages.push(...regular("energy", 4, 8));
  if (module2.id === "sleep") pages.push(...regular("sleep", 9, 14));
  if (module2.id === "mind") pages.push(...regular("mind", 15, 19));
  if (module2.id === "gut") {
    pages.push(
      page("gut", cloneLegacy("q20", { prompt: "\u8FC7\u53BB4\u5468\uFF0C\u60A8\u7684\u6392\u4FBF\u901A\u5E38\u5C5E\u4E8E\u54EA\u79CD\u60C5\u51B5\uFF1F", autoAdvance: true, subtitle: "\u8BF7\u9009\u62E9\u6700\u7B26\u5408\u65E5\u5E38\u60C5\u51B5\u7684\u4E00\u9879", options: options(["\u6BCF\u59292\u6B21\u6216\u4EE5\u4E0A\uFF0C\u6BD4\u8F83\u89C4\u5F8B", "\u901A\u5E38\u6BCF\u59291\u6B21", "\u901A\u5E38\u6BCF2\u59291\u6B21", "\u6BCF3\u5929\u6216\u66F4\u4E451\u6B21", "\u9891\u7387\u53D8\u5316\u8F83\u5927\u3001\u4E0D\u89C4\u5F8B"]) })),
      ...regular("gut", 21, 25),
      page("gut", { id: "q25Foods", prompt: "\u54EA\u4E9B\u98DF\u7269\u6BD4\u8F83\u5BB9\u6613\u5F15\u8D77\u4E0D\u9002\uFF1F", subtitle: "\u53EF\u591A\u9009", type: "multi", required: true, minSelections: 1, layout: "grid", visibleWhen: { questionId: "q25", operator: "equals", values: ["3", "4"] }, options: options(["\u4E73\u5236\u54C1", "\u9762\u98DF/\u5C0F\u9EA6", "\u8C46\u7C7B", "\u6D0B\u8471/\u849C", "\u8F9B\u8FA3\u98DF\u7269", "\u6CB9\u817B\u98DF\u7269", "\u9152\u7CBE", "\u90E8\u5206\u6C34\u679C", "\u6D77\u9C9C", "\u575A\u679C", "\u6682\u4E0D\u786E\u5B9A"]) })
    );
  }
  if (module2.id === "metabolism") pages.push(...regular("metabolism", 26, 29));
  if (module2.id === "movement") pages.push(...regular("movement", 30, 34));
  if (module2.id === "male") {
    pages.push(...Array.from({ length: 6 }, (_, index) => {
      const number = 35 + index;
      return page("male", cloneLegacy(`q${number}`, { autoAdvance: true, allowSkip: number <= 37, subtitle: "\u8BF7\u6839\u636E\u5B9E\u9645\u60C5\u51B5\u9009\u62E9" }));
    }));
  }
  if (module2.id === "lifestyle") {
    pages.push(
      page("lifestyle", { id: "workStatus", prompt: "\u60A8\u76EE\u524D\u7684\u804C\u4E1A\u72B6\u6001\u662F\uFF1F", type: "single", required: true, autoAdvance: true, options: options(["\u89C4\u5F8B\u65E5\u95F4\u5DE5\u4F5C", "\u7ECF\u5E38\u52A0\u73ED", "\u5012\u73ED\u6216\u591C\u73ED", "\u5DE5\u4F5C\u65F6\u95F4\u4E0D\u89C4\u5F8B", "\u81EA\u7531\u804C\u4E1A", "\u5176\u4ED6/\u4E0D\u56FA\u5B9A"]) }),
      ...regular("lifestyle", 41, 44),
      page("lifestyle", { id: "q44DrinkType", prompt: "\u60A8\u5E73\u65F6\u4E3B\u8981\u996E\u7528\u54EA\u7C7B\u9152\uFF1F", type: "single", required: true, autoAdvance: true, visibleWhen: { questionId: "q44", operator: "notEquals", values: ["0"] }, options: options(["\u767D\u9152", "\u5564\u9152", "\u8461\u8404\u9152", "\u9EC4\u9152", "\u6D0B\u9152/\u70C8\u9152", "\u591A\u79CD"]) }),
      ...regular("lifestyle", 45, 46),
      page("lifestyle", cloneLegacy("q47", { prompt: "\u8FC7\u53BB4\u5468\uFF0C\u4EE5\u4E0B\u54EA\u4E9B\u98DF\u7269\u60A8\u57FA\u672C\u6BCF\u5468\u90FD\u4F1A\u5403\uFF1F", subtitle: "\u53EF\u591A\u9009", type: "multi", minSelections: 1, autoAdvance: false, layout: "grid", exclusiveOption: "5", options: options(["\u852C\u83DC", "\u6C34\u679C", "\u5168\u8C37\u7269/\u6742\u7CAE", "\u8C46\u7C7B/\u8C46\u5236\u54C1", "\u575A\u679C/\u79CD\u5B50", "\u4E0A\u8FF0\u98DF\u7269\u5E73\u65F6\u90FD\u6BD4\u8F83\u5C11"]) })),
      page("lifestyle", cloneLegacy("q48", { subtitle: "\u53EF\u591A\u9009", minSelections: 1, autoAdvance: false, layout: "grid", exclusiveOption: "10" })),
      page("lifestyle", { id: "q48AntibioticWhen", prompt: "\u6700\u8FD1\u4E00\u6B21\u4F7F\u7528\u6297\u751F\u7D20\u5927\u7EA6\u662F\u4EC0\u4E48\u65F6\u5019\uFF1F", type: "single", required: true, autoAdvance: true, visibleWhen: { questionId: "q48", operator: "includes", values: ["0"] }, options: options(["2\u5468\u4EE5\u5185", "2\u20144\u5468", "1\u20143\u4E2A\u6708", "\u8BB0\u4E0D\u6E05"]) }),
      { id: "intro:safety", kind: "intro", moduleId: "lifestyle", title: "\u533B\u5B66\u5B89\u5168\u4FE1\u606F", description: "\u4EE5\u4E0B\u4FE1\u606F\u4E0D\u53C2\u4E0E\u5065\u5EB7\u8BC4\u5206\uFF0C\u4EC5\u7528\u4E8E\u5224\u65AD\u662F\u5426\u9700\u8981\u533B\u52A1\u4EBA\u5458\u8FDB\u4E00\u6B65\u4E86\u89E3\u3002", tone: "safety" },
      ...Array.from({ length: 7 }, (_, index) => {
        const number = 49 + index;
        return page("lifestyle", cloneLegacy(`q${number}`, { autoAdvance: false, confirmRequired: number === 55, tone: "safety", subtitle: "\u4EE5\u4E0B\u4FE1\u606F\u4E0D\u53C2\u4E0E\u5065\u5EB7\u8BC4\u5206" }));
      }),
      page("lifestyle", { id: "twelveWeekGoals", prompt: "\u672A\u676512\u5468\uFF0C\u60A8\u6700\u613F\u610F\u5F00\u59CB\u505A\u54EA\u4E9B\u6539\u53D8\uFF1F", subtitle: "\u6700\u591A\u9009\u62E93\u9879", type: "multi", required: true, minSelections: 1, maxSelections: 3, layout: "grid", options: options(["\u66F4\u89C4\u5F8B\u5730\u5B89\u6392\u7761\u7720", "\u6BCF\u5468\u589E\u52A0\u6709\u6C27\u8FD0\u52A8", "\u6BCF\u5468\u589E\u52A0\u529B\u91CF\u8BAD\u7EC3", "\u51CF\u5C11\u996E\u9152", "\u51CF\u5C11\u591C\u5BB5\u548C\u8FC7\u665A\u8FDB\u98DF", "\u589E\u52A0\u852C\u83DC\u3001\u5168\u8C37\u7269\u548C\u8C46\u7C7B", "\u8C03\u6574\u4F53\u91CD\u548C\u8170\u56F4", "\u8BB0\u5F55\u6392\u4FBF\u548C\u80C3\u80A0\u53CD\u5E94", "\u7BA1\u7406\u5DE5\u4F5C\u538B\u529B", "\u51CF\u5C11\u4E45\u5750", "\u6309\u8BA1\u5212\u5B8C\u6210\u5FAE\u751F\u6001\u5065\u5EB7\u7BA1\u7406", "\u5B9A\u671F\u8BB0\u5F55\u8EAB\u4F53\u53D8\u5316"]) }),
      page("lifestyle", { id: "singleImprovement", prompt: "\u5982\u679C\u672A\u676512\u5468\u53EA\u80FD\u4F18\u5148\u770B\u5230\u4E00\u9879\u6539\u5584\uFF0C\u60A8\u6700\u5E0C\u671B\u662F\u54EA\u4E00\u9879\uFF1F", type: "single", required: true, autoAdvance: false, optionsFromAnswerId: "topConcerns", options: [] })
    );
  }
}
var hospitalSurvey = {
  version: "male-health-v1.0",
  modules: hospitalModules,
  pages
};
function findHospitalQuestion(id) {
  const page2 = hospitalSurvey.pages.find((item) => item.kind === "question" && item.id === id);
  return page2?.kind === "question" ? page2.question : void 0;
}

// src/hospital/navigation.ts
function isVisible(question, answers) {
  const rule = question.visibleWhen;
  if (!rule) return true;
  const answer = answers[rule.questionId];
  if (rule.operator === "includes") return Array.isArray(answer) && rule.values.some((value) => answer.includes(value));
  if (rule.operator === "notEquals") return !rule.values.includes(String(answer ?? ""));
  return rule.values.includes(String(answer ?? ""));
}
function withDynamicOptions(page2, answers) {
  if (page2.kind !== "question" || !page2.question.optionsFromAnswerId) return page2;
  const source = findHospitalQuestion(page2.question.optionsFromAnswerId);
  const selected = answers[page2.question.optionsFromAnswerId];
  const values = Array.isArray(selected) ? selected : [];
  return {
    ...page2,
    question: {
      ...page2.question,
      options: source?.options?.filter((option) => values.includes(option.value)) ?? []
    }
  };
}
function getVisibleSurveyPages(answers) {
  return hospitalSurvey.pages.filter((page2) => page2.kind === "intro" || isVisible(page2.question, answers)).map((page2) => withDynamicOptions(page2, answers));
}
function pruneHiddenAnswers(answers) {
  const visibleIds = new Set(getVisibleSurveyPages(answers).map((page2) => page2.id));
  const conditionalIds = hospitalSurvey.pages.filter((page2) => page2.kind === "question" && page2.question.visibleWhen).map((page2) => page2.id);
  const next = { ...answers };
  for (const id of conditionalIds) if (!visibleIds.has(id)) delete next[id];
  return next;
}

// src/hospital/normalize.ts
var questionIds = new Set(
  hospitalSurvey.pages.filter((page2) => page2.kind === "question").map((page2) => page2.id)
);
function q47Score(value) {
  if (!Array.isArray(value) || value.includes("5")) return "4";
  const count = new Set(value).size;
  if (count >= 5) return "0";
  if (count === 4) return "1";
  if (count === 3) return "2";
  if (count >= 1) return "3";
  return "4";
}
function optionLabel(questionId, value) {
  return findHospitalQuestion(questionId)?.options?.find((option) => option.value === value)?.label ?? "";
}
function normalizeHospitalAnswers(input) {
  const answers = pruneHiddenAnswers(input);
  const healthAnswers = {};
  for (const [id, value] of Object.entries(answers)) {
    if (questionIds.has(id) && id !== "name" && id !== "phone") healthAnswers[id] = value;
  }
  healthAnswers.date = String(answers.date ?? "");
  healthAnswers.workStatusOther = "";
  healthAnswers.topConcernsOther = "";
  healthAnswers.q25Food = "";
  healthAnswers.q44Drink = optionLabel("q44DrinkType", answers.q44DrinkType);
  healthAnswers.q48Details = "";
  healthAnswers.twelveWeekGoalsOther = "";
  const selectedFoods = Array.isArray(answers.q47) ? answers.q47 : [];
  const derivedQ47 = q47Score(selectedFoods);
  healthAnswers.q47Foods = selectedFoods;
  healthAnswers.q47 = derivedQ47;
  const sensitiveAnswers = {};
  for (const id of ["q35", "q36", "q37"]) {
    const value = answers[id];
    if (value === "__skip__") {
      healthAnswers[id] = null;
      sensitiveAnswers[id] = { answered: false, value: null };
    } else {
      sensitiveAnswers[id] = { answered: true, value: String(value ?? "") };
    }
  }
  healthAnswers.sensitiveAnswers = sensitiveAnswers;
  const assessmentAnswers = Object.fromEntries(
    Object.entries(healthAnswers).filter(([, value]) => value === null || typeof value === "string" || typeof value === "number" || Array.isArray(value))
  );
  assessmentAnswers.q47 = derivedQ47;
  const phone = String(answers.phone ?? "");
  return {
    identity: { name: String(answers.name ?? "").trim().slice(0, 80), phone, phoneLast4: phone.slice(-4), age: null },
    healthAnswers,
    assessmentAnswers
  };
}

// src/hospital/validation.ts
var isEmpty2 = (value) => value === void 0 || value === null || value === "" || Array.isArray(value) && value.length === 0;
function validateHospitalQuestion(question, answers) {
  const value = answers[question.id];
  if (question.required && isEmpty2(value)) return question.type === "text" || question.type === "phone" ? "\u8BF7\u586B\u5199\u6B64\u9879" : "\u8BF7\u9009\u62E9\u4E00\u9879";
  if (question.type === "phone" && !/^1[3-9]\d{9}$/.test(String(value ?? ""))) return "\u8BF7\u8F93\u5165\u6709\u6548\u768411\u4F4D\u4E2D\u56FD\u5927\u9646\u624B\u673A\u53F7\u7801";
  if (question.id === "name" && !String(value ?? "").trim()) return "\u8BF7\u586B\u5199\u59D3\u540D";
  if (question.type === "multi" && Array.isArray(value)) {
    if (question.minSelections && value.length < question.minSelections) return `\u8BF7\u81F3\u5C11\u9009\u62E9${question.minSelections}\u9879`;
    if (question.maxSelections && value.length > question.maxSelections) return `\u6700\u591A\u9009\u62E9${question.maxSelections}\u9879`;
  }
  if (question.optionsFromAnswerId) {
    const source = answers[question.optionsFromAnswerId];
    if (!Array.isArray(source) || !source.includes(String(value ?? ""))) return "\u8BF7\u9009\u62E9\u524D\u9762\u5DF2\u5173\u6CE8\u7684\u4E00\u9879";
  }
  return void 0;
}
function validateHospitalSubmission(answers) {
  const errors = {};
  for (const page2 of getVisibleSurveyPages(answers)) {
    if (page2.kind !== "question") continue;
    const error = validateHospitalQuestion(page2.question, answers);
    if (error) errors[page2.id] = error;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(answers.date ?? ""))) errors.date = "\u586B\u5199\u65E5\u671F\u65E0\u6548";
  return errors;
}

// src/domain/submission.ts
var SubmissionError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
  code;
};
var allowedAnswerIds = /* @__PURE__ */ new Set([
  ...maleHealthV1.sections.flatMap((section) => section.questions.map((question) => question.id)),
  ...hospitalSurvey.pages.filter((page2) => page2.kind === "question").map((page2) => page2.id),
  "date"
]);
var supportedQuestionnaireVersions = /* @__PURE__ */ new Set([
  maleHealthV1.version,
  "nuoma-yuanyi-male-health-v1.0"
]);
function parsePayload(input) {
  if (!input || typeof input !== "object") throw new SubmissionError("INVALID_PAYLOAD", "\u63D0\u4EA4\u5185\u5BB9\u683C\u5F0F\u4E0D\u6B63\u786E");
  const payload = input;
  if (payload.honeypot) throw new SubmissionError("BOT_REJECTED", "\u8BF7\u6C42\u5DF2\u62D2\u7EDD");
  if (!payload.questionnaireVersion || !supportedQuestionnaireVersions.has(payload.questionnaireVersion)) {
    throw new SubmissionError("INVALID_PAYLOAD", "\u95EE\u5377\u7248\u672C\u4E0D\u53D7\u652F\u6301");
  }
  if (!payload.clientSubmissionId || !/^[a-zA-Z0-9-]{16,64}$/.test(payload.clientSubmissionId)) {
    throw new SubmissionError("INVALID_PAYLOAD", "\u63D0\u4EA4\u6807\u8BC6\u65E0\u6548");
  }
  if (!payload.answers || typeof payload.answers !== "object" || Array.isArray(payload.answers)) {
    throw new SubmissionError("INVALID_PAYLOAD", "\u95EE\u5377\u7B54\u6848\u683C\u5F0F\u4E0D\u6B63\u786E");
  }
  if (JSON.stringify(payload.answers).length > 5e4) {
    throw new SubmissionError("INVALID_PAYLOAD", "\u63D0\u4EA4\u5185\u5BB9\u8D85\u51FA\u9650\u5236");
  }
  for (const [key, value] of Object.entries(payload.answers)) {
    if (!allowedAnswerIds.has(key)) continue;
    if (typeof value === "string" && value.length > 2e3) throw new SubmissionError("INVALID_PAYLOAD", "\u6587\u672C\u5185\u5BB9\u8D85\u51FA\u9650\u5236");
    if (Array.isArray(value) && (value.length > 20 || value.some((item) => typeof item !== "string" || item.length > 80))) {
      throw new SubmissionError("INVALID_PAYLOAD", "\u9009\u9879\u5185\u5BB9\u683C\u5F0F\u4E0D\u6B63\u786E");
    }
  }
  const mobileHospitalPayload = typeof payload.answers.phone === "string";
  const errors = mobileHospitalPayload ? Object.values(validateHospitalSubmission(payload.answers)) : maleHealthV1.sections.flatMap((section) => Object.values(validateStep(section.id, payload.answers)));
  if (errors.length) throw new SubmissionError("INVALID_PAYLOAD", "\u95EE\u5377\u5C1A\u672A\u5B8C\u6574\u586B\u5199");
  return payload;
}
function confirmationId() {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `JS-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}
function createSubmissionService(persistence2) {
  return {
    async submit(input) {
      const payload = parsePayload(input);
      const existing = await persistence2.find(payload.clientSubmissionId);
      if (existing) return existing;
      const mobileHospitalPayload = typeof payload.answers.phone === "string";
      let identity;
      let healthAnswers;
      let assessmentAnswers;
      if (mobileHospitalPayload) {
        const normalized = normalizeHospitalAnswers(payload.answers);
        identity = normalized.identity;
        healthAnswers = normalized.healthAnswers;
        assessmentAnswers = normalized.assessmentAnswers;
      } else {
        const sanitized = Object.fromEntries(
          Object.entries(payload.answers).filter(([id2]) => allowedAnswerIds.has(id2))
        );
        identity = {
          name: String(payload.answers.name).trim().slice(0, 80),
          age: Number(payload.answers.age),
          phoneLast4: String(payload.answers.phoneLast4)
        };
        delete sanitized.name;
        delete sanitized.age;
        delete sanitized.phoneLast4;
        healthAnswers = sanitized;
        assessmentAnswers = sanitized;
      }
      const assessment = assessSurvey(assessmentAnswers);
      const id = confirmationId();
      await persistence2.save({
        session: {
          clientSubmissionId: payload.clientSubmissionId,
          confirmationId: id,
          questionnaireVersion: payload.questionnaireVersion,
          submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
          hasRedFlag: assessment.hasRedFlag
        },
        identity,
        healthAnswers,
        assessment
      });
      return { confirmationId: id, assessment };
    }
  };
}

// src/domain/collections.ts
var collections = {
  sessions: "health_survey_sessions",
  profiles: "health_respondent_profiles",
  answers: "health_survey_answers",
  assessments: "health_assessment_results",
  auditLogs: "health_audit_logs"
};

// functions/submitSurvey/src/wecom.ts
function safeInline(value) {
  return value.replace(/[\r\n<>`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
function maskPhone(phone) {
  if (!phone || !/^1\d{10}$/.test(phone)) return "\u672A\u63D0\u4F9B";
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
function buildWeComMarkdown(record) {
  const status = record.session.hasRedFlag ? '<font color="warning">\u5EFA\u8BAE\u4F18\u5148\u4EBA\u5DE5\u786E\u8BA4</font>' : '<font color="info">\u5DF2\u5B8C\u6210\u91C7\u96C6</font>';
  return [
    "### \u5EFA\u59CB\u6C11\u65CF\u533B\u9662\uFF5C\u65B0\u5065\u5EB7\u95EE\u5377",
    `> \u63D0\u4EA4\u72B6\u6001\uFF1A${status}`,
    `> \u59D3\u540D\uFF1A${safeInline(record.identity.name)}`,
    `> \u624B\u673A\uFF1A${maskPhone(record.identity.phone)}`,
    `> \u8BB0\u5F55\u7F16\u53F7\uFF1A${safeInline(record.session.confirmationId)}`,
    `> \u63D0\u4EA4\u65F6\u95F4\uFF1A${safeInline(record.session.submittedAt)}`,
    "",
    "\u8BF7\u5728\u9662\u5185\u7CFB\u7EDF\u6838\u5B9E\u5B8C\u6574\u4FE1\u606F\uFF1B\u7FA4\u5185\u901A\u77E5\u4E0D\u5C55\u793A\u5177\u4F53\u5065\u5EB7\u7B54\u6848\u3002"
  ].join("\n");
}
function validateWebhook(webhookUrl) {
  let url;
  try {
    url = new URL(webhookUrl);
  } catch {
    throw new Error("\u4F01\u4E1A\u5FAE\u4FE1\u901A\u77E5\u5730\u5740\u65E0\u6548");
  }
  if (url.protocol !== "https:" || url.hostname !== "qyapi.weixin.qq.com" || url.pathname !== "/cgi-bin/webhook/send" || !url.searchParams.get("key")) {
    throw new Error("\u4F01\u4E1A\u5FAE\u4FE1\u901A\u77E5\u5730\u5740\u65E0\u6548");
  }
  return url;
}
async function sendWeComNotification(webhookUrl, markdown, fetcher = fetch) {
  const url = validateWebhook(webhookUrl);
  try {
    const response2 = await fetcher(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ msgtype: "markdown", markdown: { content: markdown } }),
      signal: AbortSignal.timeout(5e3)
    });
    const result = await response2.json();
    if (!response2.ok || result.errcode !== 0) throw new Error("rejected");
  } catch {
    throw new Error("\u4F01\u4E1A\u5FAE\u4FE1\u901A\u77E5\u5931\u8D25");
  }
}

// functions/submitSurvey/src/index.ts
var app = (0, import_node_sdk.init)({ env: import_node_sdk.SYMBOL_CURRENT_ENV });
var db = app.database();
var DEFAULT_ALLOWED_ORIGIN = "https://yuecheng-survey-d4fucklsf6b68aaf-1388047663.tcloudbaseapp.com";
var persistence = {
  async find(clientSubmissionId) {
    const sessions = await db.collection(collections.sessions).where({ clientSubmissionId }).limit(1).get();
    const session = sessions.data[0];
    if (!session) return null;
    const results = await db.collection(collections.assessments).where({ sessionId: session._id }).limit(1).get();
    const assessment = results.data[0]?.assessment;
    return assessment ? { confirmationId: session.confirmationId, assessment } : null;
  },
  async save(record) {
    const sessionResult = await db.collection(collections.sessions).add(record.session);
    const sessionId = sessionResult.id;
    await Promise.all([
      db.collection(collections.profiles).add({ sessionId, ...record.identity }),
      db.collection(collections.answers).add({ sessionId, answers: record.healthAnswers }),
      db.collection(collections.assessments).add({ sessionId, assessment: record.assessment }),
      db.collection(collections.auditLogs).add({ sessionId, action: "public_submission", createdAt: record.session.submittedAt })
    ]);
    let notificationStatus = "not_applicable";
    if (record.identity.phone) {
      const webhookUrl = process.env.HOSPITAL_WECHAT_WEBHOOK_URL;
      if (!webhookUrl) {
        notificationStatus = "not_configured";
      } else {
        try {
          await sendWeComNotification(webhookUrl, buildWeComMarkdown(record));
          notificationStatus = "sent";
        } catch {
          notificationStatus = "failed";
          console.error("hospital WeCom notification failed");
        }
      }
    }
    try {
      await db.collection(collections.auditLogs).add({
        sessionId,
        action: "hospital_wecom_notification",
        status: notificationStatus,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch {
      console.error("hospital notification audit write failed");
    }
  }
};
var service = createSubmissionService(persistence);
function response(statusCode, body, origin = "*") {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      "cache-control": "no-store"
    },
    body: JSON.stringify(body)
  };
}
async function main(event) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN;
  const requestContext = event.requestContext;
  const method = String(event.httpMethod ?? requestContext?.httpMethod ?? "POST").toUpperCase();
  if (method === "OPTIONS") return response(204, {}, allowedOrigin);
  if (method !== "POST") return response(405, { error: "\u4EC5\u652F\u6301POST\u63D0\u4EA4" }, allowedOrigin);
  try {
    const rawBody = event.body;
    const payload = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
    return response(200, await service.submit(payload), allowedOrigin);
  } catch (error) {
    if (error instanceof SubmissionError) {
      return response(error.code === "BOT_REJECTED" ? 403 : 400, { error: error.message, code: error.code }, allowedOrigin);
    }
    console.error("submitSurvey failed", error instanceof Error ? error.message : "unknown error");
    return response(500, { error: "\u6682\u65F6\u65E0\u6CD5\u63D0\u4EA4\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", code: "INTERNAL_ERROR" }, allowedOrigin);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main
});
