var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// functions/submitSurvey/src/index.ts
var index_exports = {};
__export(index_exports, {
  main: () => main
});
module.exports = __toCommonJS(index_exports);
var import_node_sdk = require("@cloudbase/node-sdk");
var import_node_path = __toESM(require("node:path"));

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
  let domains2 = [
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
    domains2 = domains2.map((item) => ({
      ...item,
      level: "clinical_priority",
      reasons: ["\u533B\u5B66\u5B89\u5168\u4FE1\u606F\u9700\u8981\u533B\u52A1\u4EBA\u5458\u4F18\u5148\u6838\u5B9E"],
      recommendation: "\u8BF7\u5148\u7531\u533B\u52A1\u4EBA\u5458\u5B8C\u6210\u4FE1\u606F\u6838\u5B9E\u4E0E\u98CE\u9669\u5224\u65AD\uFF0C\u518D\u51B3\u5B9A\u540E\u7EED\u5065\u5EB7\u7BA1\u7406\u8DEF\u5F84\u3002"
    }));
  }
  return { domains: domains2, hasRedFlag: redFlags.length > 0, redFlags };
}

// src/domain/questionnaire.ts
var scored = (labels2) => labels2.map((label3, score2) => ({ value: String(score2), label: label3, score: score2 }));
var frequency = scored(["\u4ECE\u4E0D", "\u5076\u5C14", "\u6709\u65F6", "\u7ECF\u5E38", "\u51E0\u4E4E\u6BCF\u5929"]);
var trend = scored(["\u660E\u663E\u53D8\u597D", "\u7565\u6709\u53D8\u597D", "\u57FA\u672C\u6CA1\u53D8\u5316", "\u7565\u6709\u4E0B\u964D", "\u660E\u663E\u4E0B\u964D"]);
var yesNo = [
  { value: "0", label: "\u5426", score: 0 },
  { value: "1", label: "\u662F", score: 1 }
];
var single = (number, prompt, options3 = frequency) => ({
  id: `q${number}`,
  number,
  prompt,
  type: "single",
  options: options3,
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
        { id: "workStatus", prompt: "\u804C\u4E1A\u72B6\u6001", type: "single", required: true, options: ["\u89C4\u5F8B\u65E5\u95F4\u5DE5\u4F5C", "\u7ECF\u5E38\u52A0\u73ED", "\u5012\u73ED\u6216\u591C\u73ED", "\u5DE5\u4F5C\u65F6\u95F4\u4E0D\u89C4\u5F8B", "\u81EA\u7531\u804C\u4E1A", "\u5176\u4ED6"].map((label3, index) => ({ value: String(index), label: label3 })) },
        { id: "workStatusOther", prompt: "\u5176\u4ED6\u804C\u4E1A\u72B6\u6001", type: "text", placeholder: "\u5982\u9009\u62E9\u5176\u4ED6\uFF0C\u8BF7\u586B\u5199" },
        { id: "topConcerns", prompt: "\u5982\u679C\u53EA\u80FD\u4F18\u5148\u6539\u55843\u4E2A\u95EE\u9898\uFF0C\u60A8\u76EE\u524D\u6700\u5E0C\u671B\u6539\u5584\u7684\u662F", type: "multi", required: true, maxSelections: 3, options: ["\u7CBE\u529B\u4E0D\u8DB3", "\u7761\u7720", "\u4F53\u91CD\u6216\u8179\u90E8\u8102\u80AA", "\u6392\u4FBF\u6216\u80C3\u80A0\u4E0D\u9002", "\u538B\u529B\u4E0E\u60C5\u7EEA", "\u8BB0\u5FC6\u529B\u6216\u6CE8\u610F\u529B", "\u8FD0\u52A8\u80FD\u529B", "\u808C\u8089\u529B\u91CF", "\u8170\u80CC\u6216\u5173\u8282\u4E0D\u9002", "\u6027\u6B32\u6216\u6027\u529F\u80FD", "\u6392\u5C3F\u95EE\u9898", "\u996E\u9152\u540E\u7684\u8EAB\u4F53\u6062\u590D", "\u5176\u4ED6"].map((label3, index) => ({ value: String(index), label: label3 })) },
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
        { id: "q48", number: 48, prompt: "\u8FD13\u4E2A\u6708\u662F\u5426\u4F7F\u7528\u8FC7\u4EE5\u4E0B\u4EA7\u54C1\u6216\u836F\u7269\uFF1F", type: "multi", required: true, options: ["\u6297\u751F\u7D20", "\u6CFB\u836F", "\u6291\u9178\u836F", "\u76CA\u751F\u83CC", "\u76CA\u751F\u5143", "\u86CB\u767D\u7C89", "\u51CF\u91CD\u836F\u7269", "\u7761\u7720\u836F\u7269", "\u6FC0\u7D20\u76F8\u5173\u836F\u7269", "\u5176\u4ED6\u8425\u517B\u8865\u5145\u5242", "\u5747\u65E0"].map((label3, index) => ({ value: String(index), label: label3 })) },
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
        { id: "twelveWeekGoals", prompt: "\u8BF7\u9009\u62E9\u672A\u676512\u5468\u6700\u613F\u610F\u5B9E\u9645\u6539\u53D8\u76843\u4EF6\u4E8B\u60C5", type: "multi", required: true, maxSelections: 3, options: ["\u6539\u5584\u7761\u7720", "\u51CF\u5C11\u75B2\u52B3", "\u51CF\u5C11\u8179\u90E8\u8102\u80AA", "\u6539\u5584\u6392\u4FBF", "\u51CF\u5C11\u8179\u80C0", "\u589E\u52A0\u8FD0\u52A8", "\u589E\u52A0\u529B\u91CF\u8BAD\u7EC3", "\u51CF\u5C11\u996E\u9152", "\u6539\u5584\u996E\u98DF\u7ED3\u6784", "\u7BA1\u7406\u538B\u529B", "\u6539\u5584\u7537\u6027\u6D3B\u529B", "\u6539\u5584\u6392\u5C3F", "\u63D0\u9AD8\u6CE8\u610F\u529B\u548C\u5DE5\u4F5C\u6548\u7387", "\u5176\u4ED6"].map((label3, index) => ({ value: String(index), label: label3 })) },
        { id: "twelveWeekGoalsOther", prompt: "\u5176\u4ED6\u76EE\u6807", type: "text", placeholder: "\u8BF7\u586B\u5199" },
        { id: "singleImprovement", prompt: "\u5982\u679C\u672A\u676512\u5468\u53EA\u80FD\u770B\u5230\u4E00\u4E2A\u660E\u663E\u6539\u5584\uFF0C\u60A8\u6700\u5E0C\u671B\u662F\u4EC0\u4E48\uFF1F", type: "text", required: true, placeholder: "\u5199\u4E0B\u6700\u91CD\u8981\u7684\u4E00\u4E2A\u53D8\u5316" }
      ]
    }
  ]
};

// src/domain/validation.ts
var isEmpty = (value3) => value3 === void 0 || value3 === "" || Array.isArray(value3) && value3.length === 0;
var questionById = new Map(
  maleHealthV1.sections.flatMap((section) => section.questions).map((question2) => [question2.id, question2])
);
function validateQuestions(questionIds3, answers) {
  const errors = {};
  for (const questionId of questionIds3) {
    const question2 = questionById.get(questionId);
    if (!question2) {
      errors[questionId] = "\u95EE\u5377\u9898\u76EE\u4E0D\u5B58\u5728";
      continue;
    }
    const value3 = answers[question2.id];
    if (question2.required && isEmpty(value3)) {
      errors[question2.id] = question2.type === "text" || question2.type === "number" || question2.type === "date" ? "\u8BF7\u586B\u5199\u6B64\u9879" : "\u8BF7\u9009\u62E9\u4E00\u9879";
      continue;
    }
    if (question2.maxSelections && Array.isArray(value3) && value3.length > question2.maxSelections) {
      errors[question2.id] = `\u6700\u591A\u9009\u62E9${question2.maxSelections}\u9879`;
    }
  }
  const name = String(answers.name ?? "").trim();
  const age = Number(answers.age);
  const phoneLast4 = String(answers.phoneLast4 ?? "");
  if (questionIds3.includes("name") && !name) errors.name = "\u8BF7\u586B\u5199\u59D3\u540D";
  if (questionIds3.includes("age") && (!Number.isInteger(age) || age < 40 || age > 55)) errors.age = "\u8BF7\u8F93\u516540\u201455\u4E4B\u95F4\u7684\u6574\u6570\u5E74\u9F84";
  if (questionIds3.includes("phoneLast4") && !/^\d{4}$/.test(phoneLast4)) errors.phoneLast4 = "\u8BF7\u8F93\u5165\u624B\u673A\u53F7\u540E4\u4F4D\u6570\u5B57";
  return errors;
}
function validateStep(sectionId, answers) {
  const section = maleHealthV1.sections.find((item) => item.id === sectionId);
  if (!section) return { _section: "\u95EE\u5377\u6B65\u9AA4\u4E0D\u5B58\u5728" };
  return validateQuestions(section.questions.map(({ id }) => id), answers);
}

// src/hospital/surveyDefinition.ts
var legacyQuestions = new Map(
  maleHealthV1.sections.flatMap((section) => section.questions).map((question2) => [question2.id, question2])
);
var cloneLegacy = (id, overrides = {}) => {
  const question2 = legacyQuestions.get(id);
  if (!question2) throw new Error(`\u7F3A\u5C11\u65E2\u6709\u9898\u76EE\uFF1A${id}`);
  return { ...question2, ...overrides, options: overrides.options ?? question2.options };
};
var options = (labels2) => labels2.map((label3, index) => ({ value: String(index), label: label3 }));
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
var page = (moduleId, question2) => ({ id: question2.id, kind: "question", moduleId, question: question2 });
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
function isVisible(question2, answers) {
  const rule = question2.visibleWhen;
  if (!rule) return true;
  const answer = answers[rule.questionId];
  if (rule.operator === "includes") return Array.isArray(answer) && rule.values.some((value3) => answer.includes(value3));
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
function q47Score(value3) {
  if (!Array.isArray(value3) || value3.includes("5")) return "4";
  const count = new Set(value3).size;
  if (count >= 5) return "0";
  if (count === 4) return "1";
  if (count === 3) return "2";
  if (count >= 1) return "3";
  return "4";
}
function optionLabel(questionId, value3) {
  return findHospitalQuestion(questionId)?.options?.find((option) => option.value === value3)?.label ?? "";
}
function normalizeHospitalAnswers(input) {
  const answers = pruneHiddenAnswers(input);
  const healthAnswers = {};
  for (const [id, value3] of Object.entries(answers)) {
    if (questionIds.has(id) && id !== "name" && id !== "phone") healthAnswers[id] = value3;
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
    const value3 = answers[id];
    if (value3 === "__skip__") {
      healthAnswers[id] = null;
      sensitiveAnswers[id] = { answered: false, value: null };
    } else {
      sensitiveAnswers[id] = { answered: true, value: String(value3 ?? "") };
    }
  }
  healthAnswers.sensitiveAnswers = sensitiveAnswers;
  const assessmentAnswers = Object.fromEntries(
    Object.entries(healthAnswers).filter(([, value3]) => value3 === null || typeof value3 === "string" || typeof value3 === "number" || Array.isArray(value3))
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
var isEmpty2 = (value3) => value3 === void 0 || value3 === null || value3 === "" || Array.isArray(value3) && value3.length === 0;
function validateHospitalQuestion(question2, answers) {
  const value3 = answers[question2.id];
  if (question2.required && isEmpty2(value3)) return question2.type === "text" || question2.type === "phone" ? "\u8BF7\u586B\u5199\u6B64\u9879" : "\u8BF7\u9009\u62E9\u4E00\u9879";
  if (question2.type === "phone" && !/^1[3-9]\d{9}$/.test(String(value3 ?? ""))) return "\u8BF7\u8F93\u5165\u6709\u6548\u768411\u4F4D\u4E2D\u56FD\u5927\u9646\u624B\u673A\u53F7\u7801";
  if (question2.id === "name" && !String(value3 ?? "").trim()) return "\u8BF7\u586B\u5199\u59D3\u540D";
  if (question2.type === "multi" && Array.isArray(value3)) {
    if (question2.minSelections && value3.length < question2.minSelections) return `\u8BF7\u81F3\u5C11\u9009\u62E9${question2.minSelections}\u9879`;
    if (question2.maxSelections && value3.length > question2.maxSelections) return `\u6700\u591A\u9009\u62E9${question2.maxSelections}\u9879`;
  }
  if (question2.optionsFromAnswerId) {
    const source = answers[question2.optionsFromAnswerId];
    if (!Array.isArray(source) || !source.includes(String(value3 ?? ""))) return "\u8BF7\u9009\u62E9\u524D\u9762\u5DF2\u5173\u6CE8\u7684\u4E00\u9879";
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

// src/female/surveyDefinition.ts
var options2 = (labels2) => labels2.map((label3, index) => ({ value: String(index), label: label3 }));
var signal = (...values) => Object.fromEntries(values.map((value3, index) => [String(index), value3]));
var visible = (questionId, values) => ({ questionId, operator: "equals", values });
var question = (number, moduleId, prompt, type, labels2 = [], extra = {}) => ({
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
    options: labels2.length ? options2(labels2) : void 0,
    ...extra
  }
});
var femaleModules = [
  { id: "identity", index: 1, title: "\u57FA\u672C\u4FE1\u606F", introTitle: "\u5148\u4ECE\u57FA\u672C\u4FE1\u606F\u5F00\u59CB", introDescription: "\u59D3\u540D\u4E0E\u624B\u673A\u53F7\u7528\u4E8E\u9662\u5185\u8BB0\u5F55\u5339\u914D\uFF0C\u586B\u5199\u65E5\u671F\u7531\u7CFB\u7EDF\u81EA\u52A8\u751F\u6210\u3002", icon: "user" },
  { id: "lifecycle", index: 2, title: "\u5973\u6027\u751F\u547D\u5468\u671F", introTitle: "\u4E86\u89E3\u60A8\u5F53\u524D\u7684\u5973\u6027\u751F\u547D\u5468\u671F\u72B6\u6001", introDescription: "\u6708\u7ECF\u548C\u8840\u7BA1\u8212\u7F29\u53D8\u5316\u6709\u52A9\u4E8E\u5B89\u6392\u66F4\u9002\u5408\u7684\u5065\u5EB7\u8BC4\u4F30\u3002", icon: "flower" },
  { id: "mind", index: 3, title: "\u7761\u7720\u3001\u60C5\u7EEA\u4E0E\u8BA4\u77E5", introTitle: "\u5173\u6CE8\u7761\u7720\u4E0E\u8EAB\u5FC3\u72B6\u6001", introDescription: "\u8BF7\u6839\u636E\u8FC7\u53BB4\u5468\u7684\u771F\u5B9E\u611F\u53D7\u4F5C\u7B54\u3002", icon: "moon" },
  { id: "metabolic", index: 4, title: "\u4EE3\u8C22\u4E0E\u5FC3\u8840\u7BA1", introTitle: "\u4E86\u89E3\u4F53\u91CD\u3001\u4EE3\u8C22\u4E0E\u6D3B\u52A8\u611F\u53D7", introDescription: "\u53EA\u9700\u63CF\u8FF0\u65E5\u5E38\u53D8\u5316\uFF0C\u4E0D\u9700\u8981\u53C2\u8003\u4F53\u68C0\u7ED3\u679C\u3002", icon: "heart" },
  { id: "movement", index: 5, title: "\u9AA8\u9ABC\u3001\u808C\u8089\u4E0E\u529F\u80FD", introTitle: "\u4E86\u89E3\u9AA8\u9ABC\u4E0E\u8EAB\u4F53\u529F\u80FD\u50A8\u5907", introDescription: "\u8BF7\u6BD4\u8F83\u8FD1\u671F\u529B\u91CF\u3001\u6D3B\u52A8\u548C\u8EAB\u4F53\u59FF\u52BF\u53D8\u5316\u3002", icon: "activity" },
  { id: "women", index: 6, title: "\u4E73\u817A\u3001\u5987\u79D1\u4E0E\u6CCC\u5C3F\u751F\u6B96", introTitle: "\u5973\u6027\u4E13\u9879\u5065\u5EB7\u4FE1\u606F", introDescription: "\u8FD9\u4E9B\u95EE\u9898\u7528\u4E8E\u5224\u65AD\u662F\u5426\u9700\u8981\u8FDB\u4E00\u6B65\u4E13\u9879\u8BC4\u4F30\uFF0C\u53EF\u4EE5\u6309\u5B9E\u9645\u60C5\u51B5\u4F5C\u7B54\u3002", icon: "shield" },
  { id: "gut", index: 7, title: "\u6D88\u5316\u4E0E\u80A0\u9053\u5FAE\u751F\u6001", introTitle: "\u4E86\u89E3\u6D88\u5316\u4E0E\u6392\u4FBF\u72B6\u6001", introDescription: "\u80C3\u80A0\u4F53\u611F\u5C06\u4E0E\u996E\u98DF\u548C\u65E2\u5F80\u7528\u836F\u4E00\u8D77\u7EFC\u5408\u5206\u6790\u3002", icon: "leaf" },
  { id: "history", index: 8, title: "\u751F\u6D3B\u65B9\u5F0F\u4E0E\u65E2\u5F80\u5065\u5EB7", introTitle: "\u6700\u540E\u4E86\u89E3\u751F\u6D3B\u65B9\u5F0F\u548C\u5065\u5EB7\u80CC\u666F", introDescription: "\u7528\u4E8E\u5B89\u6392\u7B5B\u67E5\u3001\u4F53\u68C0\u4E0E\u540E\u7EED\u5065\u5EB7\u7BA1\u7406\u91CD\u70B9\u3002", icon: "clipboard" },
  { id: "priorities", index: 9, title: "\u5F53\u524D\u91CD\u70B9\u9700\u6C42", introTitle: "\u60A8\u6700\u5E0C\u671B\u89E3\u51B3\u4EC0\u4E48", introDescription: "\u8BF7\u9009\u62E9\u672C\u6B21\u6700\u5E0C\u671B\u5173\u6CE8\u7684\u65B9\u5411\u3002", icon: "target" },
  { id: "overall", index: 10, title: "\u6574\u4F53\u5065\u5EB7\u611F\u53D7", introTitle: "\u6574\u4F53\u5065\u5EB7\u611F\u53D7", introDescription: "\u7528\u60A8\u81EA\u5DF1\u7684\u611F\u53D7\u5B8C\u6210\u6700\u540E\u4E24\u9898\u3002", icon: "sparkles" }
];
var q = [
  question(1, "identity", "\u8BF7\u95EE\u60A8\u7684\u59D3\u540D\u662F\uFF1F", "text", [], { placeholder: "\u8BF7\u8F93\u5165\u771F\u5B9E\u59D3\u540D", autocomplete: "name", autoAdvance: false }),
  question(2, "identity", "\u8BF7\u586B\u5199\u60A8\u7684\u624B\u673A\u53F7\u7801", "phone", [], { placeholder: "\u8BF7\u8F93\u516511\u4F4D\u624B\u673A\u53F7", autocomplete: "tel", autoAdvance: false }),
  question(3, "identity", "\u586B\u5199\u65E5\u671F", "date", [], { autoAdvance: false, helper: "\u7531\u7CFB\u7EDF\u81EA\u52A8\u751F\u6210" }),
  question(4, "identity", "\u60A8\u76EE\u524D\u7684\u5E74\u9F84\u662F\uFF1F", "single", ["40\u201444\u5C81", "45\u201449\u5C81", "50\u201454\u5C81", "55\u201459\u5C81", "60\u201464\u5C81", "65\u201469\u5C81", "70\u5C81\u53CA\u4EE5\u4E0A"]),
  question(5, "lifecycle", "\u60A8\u76EE\u524D\u7684\u6708\u7ECF\u72B6\u6001\u6700\u7B26\u5408\u4EE5\u4E0B\u54EA\u4E00\u79CD\uFF1F", "single", ["\u6708\u7ECF\u57FA\u672C\u89C4\u5F8B", "\u4ECD\u6709\u6708\u7ECF\uFF0C\u4F46\u5468\u671F\u5F00\u59CB\u51FA\u73B0\u53D8\u5316", "\u6708\u7ECF\u5F88\u4E0D\u89C4\u5F8B\uFF0C\u6709\u65F6\u6570\u6708\u4E0D\u6765", "\u5DF2\u505C\u7ECF\uFF0C\u4F46\u4E0D\u8DB312\u4E2A\u6708", "\u5DF2\u8FDE\u7EED12\u4E2A\u6708\u4EE5\u4E0A\u6CA1\u6709\u6708\u7ECF", "\u56E0\u5B50\u5BAB\u5207\u9664\u7B49\u539F\u56E0\u65E0\u6CD5\u6839\u636E\u6708\u7ECF\u5224\u65AD", "\u56E0\u836F\u7269\u3001\u624B\u672F\u6216\u5176\u4ED6\u6CBB\u7597\u5BFC\u81F4\u505C\u7ECF", "\u4E0D\u6E05\u695A"], { signalByValue: signal("none", "mild", "moderate", "moderate", "none", "none", "moderate", "mild") }),
  question(6, "lifecycle", "\u8FC7\u53BB12\u4E2A\u6708\u6708\u7ECF\u5468\u671F\u4E0E\u4EE5\u524D\u76F8\u6BD4\u6709\u53D8\u5316\u5417\uFF1F", "single", ["\u57FA\u672C\u6CA1\u6709\u53D8\u5316", "\u5076\u5C14\u63D0\u524D\u6216\u63A8\u8FDF", "\u5468\u671F\u660E\u663E\u53D8\u77ED\u6216\u53D8\u957F", "\u7ECF\u5E38\u51FA\u73B0\u8F83\u957F\u65F6\u95F4\u4E0D\u6765\u6708\u7ECF", "\u53D8\u5316\u5F88\u5927\uFF0C\u6CA1\u6709\u660E\u663E\u89C4\u5F8B"], { visibleWhen: visible("f5", ["0", "1", "2"]), signalByValue: signal("none", "mild", "moderate", "marked", "marked") }),
  question(7, "lifecycle", "\u8FC7\u53BB12\u4E2A\u6708\u7ECF\u91CF\u6216\u7ECF\u671F\u6709\u660E\u663E\u53D8\u5316\u5417\uFF1F", "single", ["\u6CA1\u6709\u660E\u663E\u53D8\u5316", "\u7ECF\u91CF\u6BD4\u4EE5\u524D\u660E\u663E\u51CF\u5C11", "\u7ECF\u91CF\u6BD4\u4EE5\u524D\u660E\u663E\u589E\u52A0", "\u7ECF\u671F\u660E\u663E\u5EF6\u957F", "\u7ECF\u91CF\u660E\u663E\u589E\u52A0\u4E14\u5BB9\u6613\u5934\u6655\u3001\u4E4F\u529B", "\u4E0D\u786E\u5B9A"], { visibleWhen: visible("f5", ["0", "1", "2"]), signalByValue: signal("none", "mild", "moderate", "moderate", "marked", "mild") }),
  question(8, "lifecycle", "\u8FDE\u7EED\u505C\u7ECF12\u4E2A\u6708\u4EE5\u540E\uFF0C\u662F\u5426\u518D\u6B21\u51FA\u73B0\u8FC7\u9634\u9053\u51FA\u8840\u6216\u8840\u6027\u5206\u6CCC\u7269\uFF1F", "single", ["\u6CA1\u6709", "\u6709\u8FC71\u6B21", "\u6709\u8FC72\u6B21\u53CA\u4EE5\u4E0A", "\u76EE\u524D\u4ECD\u6709", "\u4E0D\u786E\u5B9A"], { visibleWhen: visible("f5", ["4"]), tone: "safety", autoAdvance: false, signalByValue: signal("none", "safety", "safety", "safety", "moderate") }),
  question(9, "lifecycle", "\u8FC7\u53BB4\u5468\uFF0C\u662F\u5426\u51FA\u73B0\u7A81\u7136\u53D1\u70ED\u3001\u9762\u90E8\u6216\u4E0A\u534A\u8EAB\u6F6E\u7EA2\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u9891\u7E41\uFF0C\u5DF2\u7ECF\u5F71\u54CD\u751F\u6D3B\u6216\u5DE5\u4F5C"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(10, "lifecycle", "\u8FC7\u53BB4\u5468\uFF0C\u662F\u5426\u51FA\u73B0\u591C\u95F4\u51FA\u6C57\u660E\u663E\uFF0C\u751A\u81F3\u56E0\u4E3A\u51FA\u6C57\u9192\u6765\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u9891\u7E41\uFF0C\u660E\u663E\u5F71\u54CD\u7761\u7720"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(11, "lifecycle", "\u76EE\u524D\u662F\u5426\u5B58\u5728\u4EE5\u4E0B\u60C5\u51B5\uFF1F", "multi", ["\u505A\u8FC7\u5B50\u5BAB\u5207\u9664\u624B\u672F", "\u5207\u9664\u8FC7\u4E00\u4FA7\u5375\u5DE2", "\u5207\u9664\u8FC7\u53CC\u4FA7\u5375\u5DE2", "\u63A5\u53D7\u8FC7\u5316\u7597\u6216\u653E\u7597", "\u6B63\u5728\u4F7F\u7528\u96CC\u6FC0\u7D20/\u5B55\u6FC0\u7D20\u7B49\u6FC0\u7D20\u6CBB\u7597", "\u6B63\u5728\u4F7F\u7528\u53E3\u670D\u907F\u5B55\u836F\u6216\u5176\u4ED6\u6FC0\u7D20\u7C7B\u836F\u7269", "\u6B63\u5728\u5907\u5B55", "\u76EE\u524D\u6000\u5B55", "\u76EE\u524D\u54FA\u4E73", "\u4EE5\u4E0A\u5747\u65E0", "\u4E0D\u6E05\u695A"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["9", "10"], signalBySelectedValue: { "2": "moderate", "3": "moderate" } }),
  question(12, "mind", "\u60A8\u76EE\u524D\u5E73\u5747\u6BCF\u665A\u5B9E\u9645\u7761\u7720\u65F6\u95F4\u5927\u7EA6\u662F\u591A\u5C11\uFF1F", "single", ["7\u5C0F\u65F6\u53CA\u4EE5\u4E0A", "6\u20147\u5C0F\u65F6", "5\u20146\u5C0F\u65F6", "\u5C11\u4E8E5\u5C0F\u65F6", "\u7761\u7720\u65F6\u95F4\u5F88\u4E0D\u89C4\u5F8B"], { signalByValue: signal("none", "mild", "moderate", "marked", "moderate") }),
  question(13, "mind", "\u8FC7\u53BB4\u5468\uFF0C\u5165\u7761\u662F\u5426\u6BD4\u4EE5\u524D\u56F0\u96BE\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u51E0\u4E4E\u6BCF\u5929"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(14, "mind", "\u8FC7\u53BB4\u5468\uFF0C\u662F\u5426\u7ECF\u5E38\u591C\u95F4\u9192\u6765\u6216\u9192\u540E\u8F83\u96BE\u518D\u6B21\u5165\u7761\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u51E0\u4E4E\u6BCF\u5929"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(15, "mind", "\u8FC7\u53BB4\u5468\uFF0C\u65E9\u6668\u9192\u6765\u540E\u662F\u5426\u4ECD\u611F\u89C9\u75B2\u52B3\u3001\u6CA1\u6709\u6062\u590D\u611F\uFF1F", "single", ["\u57FA\u672C\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u51E0\u4E4E\u6BCF\u5929"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(16, "mind", "\u8FC7\u53BB4\u5468\uFF0C\u662F\u5426\u6BD4\u4EE5\u524D\u66F4\u5BB9\u6613\u70E6\u8E81\u3001\u60C5\u7EEA\u6CE2\u52A8\u6216\u5BB9\u6613\u751F\u6C14\uFF1F", "single", ["\u6CA1\u6709\u660E\u663E\u53D8\u5316", "\u8F7B\u5FAE", "\u6BD4\u8F83\u660E\u663E", "\u975E\u5E38\u660E\u663E\uFF0C\u5DF2\u7ECF\u5F71\u54CD\u751F\u6D3B\u6216\u5DE5\u4F5C"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(17, "mind", "\u8FC7\u53BB4\u5468\uFF0C\u662F\u5426\u7ECF\u5E38\u611F\u5230\u60C5\u7EEA\u4F4E\u843D\u3001\u5174\u8DA3\u4E0B\u964D\u6216\u7F3A\u5C11\u52A8\u529B\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u51E0\u4E4E\u6BCF\u5929"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(18, "mind", "\u8FC7\u53BB4\u5468\uFF0C\u662F\u5426\u7ECF\u5E38\u611F\u5230\u7D27\u5F20\u3001\u7126\u8651\u3001\u62C5\u5FC3\u5F88\u591A\u4E8B\u60C5\u6216\u96BE\u4EE5\u653E\u677E\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u51E0\u4E4E\u6BCF\u5929"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(19, "mind", "\u4E0E1\u20142\u5E74\u524D\u76F8\u6BD4\uFF0C\u6CE8\u610F\u529B\u3001\u8BB0\u5FC6\u529B\u6216\u601D\u7EF4\u6E05\u6670\u5EA6\u662F\u5426\u4E0B\u964D\uFF1F", "single", ["\u6CA1\u6709\u660E\u663E\u53D8\u5316", "\u8F7B\u5FAE\u4E0B\u964D", "\u660E\u663E\u4E0B\u964D", "\u4E0B\u964D\u5F88\u591A\uFF0C\u5DF2\u7ECF\u5F71\u54CD\u5DE5\u4F5C\u6216\u751F\u6D3B"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(20, "metabolic", "\u8FC7\u53BB1\u5E74\uFF0C\u60A8\u7684\u4F53\u91CD\u53D8\u5316\u6700\u7B26\u5408\u54EA\u79CD\u60C5\u51B5\uFF1F", "single", ["\u57FA\u672C\u7A33\u5B9A", "\u660E\u663E\u51CF\u8F7B", "\u589E\u52A0\u7EA62\u20145\u516C\u65A4", "\u589E\u52A05\u516C\u65A4\u4EE5\u4E0A", "\u4F53\u91CD\u53CD\u590D\u6CE2\u52A8\u8F83\u5927", "\u4E0D\u6E05\u695A"], { signalByValue: signal("none", "moderate", "mild", "moderate", "moderate", "mild") }),
  question(21, "metabolic", "\u6700\u8FD11\u20142\u5E74\u662F\u5426\u611F\u89C9\u8170\u8179\u90E8\u6BD4\u4EE5\u524D\u66F4\u5BB9\u6613\u957F\u80D6\uFF1F", "single", ["\u6CA1\u6709", "\u6709\u4E00\u70B9", "\u6BD4\u8F83\u660E\u663E", "\u975E\u5E38\u660E\u663E"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(22, "metabolic", "\u8FC7\u53BB4\u5468\uFF0C\u662F\u5426\u7ECF\u5E38\u9910\u540E\u56F0\u5026\u3001\u5F88\u5FEB\u53C8\u997F\u6216\u7279\u522B\u60F3\u5403\u751C\u98DF/\u7CBE\u5236\u4E3B\u98DF\uFF1F", "single", ["\u57FA\u672C\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u975E\u5E38\u660E\u663E"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(23, "metabolic", "\u4E0E\u8FC7\u53BB\u76F8\u6BD4\uFF0C\u6B65\u884C\u3001\u722C\u697C\u6216\u65E5\u5E38\u6D3B\u52A8\u65F6\u662F\u5426\u66F4\u5BB9\u6613\u80F8\u95F7\u3001\u6C14\u77ED\u3001\u5FC3\u614C\u6216\u8010\u529B\u4E0B\u964D\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14\u51FA\u73B0", "\u6BD4\u4EE5\u524D\u660E\u663E", "\u7ECF\u5E38\u51FA\u73B0", "\u6700\u8FD1\u660E\u663E\u52A0\u91CD"], { tone: "safety", autoAdvance: false, signalByValue: signal("none", "mild", "moderate", "marked", "safety") }),
  question(24, "metabolic", "\u8FD1\u671F\u662F\u5426\u51FA\u73B0\u8FC7\u6D3B\u52A8\u65F6\u660E\u663E\u80F8\u75DB\u3001\u63A5\u8FD1\u6655\u53A5\u6216\u771F\u6B63\u6655\u5012\uFF1F", "single", ["\u6CA1\u6709", "\u6709\u8FC71\u6B21", "\u6709\u8FC7\u591A\u6B21", "\u6700\u8FD1\u6B63\u5728\u53D1\u751F\u6216\u660E\u663E\u52A0\u91CD"], { tone: "safety", autoAdvance: false, signalByValue: signal("none", "safety", "safety", "safety") }),
  question(25, "metabolic", "\u7761\u89C9\u65F6\u662F\u5426\u5B58\u5728\u660E\u663E\u6253\u9F3E\u3001\u547C\u5438\u6682\u505C\u6216\u767D\u5929\u5BB9\u6613\u56F0\u5026\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38\u6253\u9F3E", "\u5BB6\u4EBA\u53D1\u73B0\u6709\u547C\u5438\u6682\u505C", "\u767D\u5929\u56F0\u5026\u975E\u5E38\u660E\u663E", "\u4E0D\u6E05\u695A"], { signalByValue: signal("none", "mild", "moderate", "marked", "marked", "mild") }),
  question(26, "metabolic", "\u8FC7\u53BB\u534A\u5E74\u662F\u5426\u51FA\u73B0\u4EE5\u4E0B\u53D8\u5316\uFF1F", "multi", ["\u6BD4\u4EE5\u524D\u660E\u663E\u6015\u51B7", "\u6BD4\u4EE5\u524D\u660E\u663E\u6015\u70ED", "\u65E0\u660E\u663E\u539F\u56E0\u5FC3\u614C", "\u624B\u6296", "\u65E0\u660E\u663E\u539F\u56E0\u4F53\u91CD\u4E0B\u964D", "\u65E0\u660E\u663E\u539F\u56E0\u4F53\u91CD\u589E\u52A0", "\u9888\u90E8\u611F\u89C9\u589E\u7C97\u6216\u6709\u80BF\u5757", "\u4EE5\u4E0A\u5747\u65E0"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["7"], signalBySelectedValue: { "0": "mild", "1": "mild", "2": "moderate", "3": "moderate", "4": "moderate", "5": "moderate", "6": "marked" } }),
  question(27, "movement", "\u8FC7\u53BB4\u5468\uFF0C\u8170\u80CC\u3001\u9888\u80A9\u3001\u819D\u5173\u8282\u6216\u5176\u4ED6\u5173\u8282\u662F\u5426\u7ECF\u5E38\u75BC\u75DB\u6216\u9178\u80C0\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u51E0\u4E4E\u6BCF\u5929", "\u5DF2\u5F71\u54CD\u6D3B\u52A8\u6216\u7761\u7720"], { signalByValue: signal("none", "mild", "moderate", "marked", "marked") }),
  question(28, "movement", "\u6700\u8FD1\u51E0\u5E74\uFF0C\u662F\u5426\u611F\u89C9\u8EAB\u9AD8\u53D8\u77EE\u3001\u9A7C\u80CC\u6216\u8EAB\u4F53\u59FF\u52BF\u660E\u663E\u6539\u53D8\uFF1F", "single", ["\u6CA1\u6709", "\u597D\u50CF\u6709\u4E00\u70B9", "\u6BD4\u8F83\u660E\u663E", "\u975E\u5E38\u660E\u663E", "\u4E0D\u6E05\u695A"], { signalByValue: signal("none", "mild", "moderate", "marked", "mild") }),
  question(29, "movement", "40\u5C81\u4EE5\u540E\u662F\u5426\u53D1\u751F\u8FC7\u8DCC\u5012\u6216\u8F7B\u5FAE\u78B0\u649E\u540E\u9AA8\u6298\uFF1F", "single", ["\u6CA1\u6709", "\u6709\u8FC71\u6B21", "\u6709\u8FC72\u6B21\u53CA\u4EE5\u4E0A", "\u4E0D\u786E\u5B9A"], { signalByValue: signal("none", "moderate", "marked", "mild") }),
  question(30, "movement", "\u4E0E1\u20142\u5E74\u524D\u76F8\u6BD4\uFF0C\u4EE5\u4E0B\u54EA\u4E9B\u52A8\u4F5C\u53D8\u5F97\u66F4\u56F0\u96BE\uFF1F", "multi", ["\u4ECE\u6905\u5B50\u4E0A\u7AD9\u8D77\u6765", "\u8FDE\u7EED\u722C\u4E24\u5C42\u697C", "\u63D0\u8D2D\u7269\u888B\u6216\u8F83\u91CD\u7269\u54C1", "\u957F\u65F6\u95F4\u6B65\u884C", "\u5355\u811A\u7AD9\u7ACB", "\u6700\u8FD1\u4E00\u5E74\u6709\u8FC7\u8DCC\u5012", "\u5747\u6CA1\u6709\u660E\u663E\u53D8\u5316"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["6"], signalBySelectedValue: { "0": "moderate", "1": "moderate", "2": "moderate", "3": "moderate", "4": "moderate", "5": "marked" } }),
  question(31, "women", "\u6700\u8FD1\u662F\u5426\u53D1\u73B0\u4E73\u623F\u51FA\u73B0\u4EE5\u4E0B\u53D8\u5316\uFF1F", "multi", ["\u65B0\u51FA\u73B0\u7684\u4E73\u623F\u80BF\u5757", "\u4E73\u5934\u8840\u6027\u5206\u6CCC\u7269", "\u4E73\u5934\u660E\u663E\u51F9\u9677\u6216\u8FD1\u671F\u5F62\u6001\u6539\u53D8", "\u4E73\u623F\u76AE\u80A4\u660E\u663E\u51F9\u9677\u3001\u6A58\u76AE\u6837\u6539\u53D8", "\u6301\u7EED\u5B58\u5728\u7684\u5C40\u90E8\u4E73\u623F\u75BC\u75DB", "\u6CA1\u6709\u4EE5\u4E0A\u60C5\u51B5"], { tone: "safety", autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["5"], signalBySelectedValue: { "0": "safety", "1": "safety", "2": "safety", "3": "safety", "4": "moderate" } }),
  question(32, "women", "\u8FC7\u53BB4\u5468\uFF0C\u662F\u5426\u7ECF\u5E38\u51FA\u73B0\u4E0B\u8179\u90E8\u6216\u76C6\u8154\u6301\u7EED\u80C0\u75DB\u3001\u5760\u80C0\u6216\u4E0D\u9002\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u51E0\u4E4E\u6BCF\u5929", "\u6700\u8FD1\u660E\u663E\u52A0\u91CD"], { tone: "safety", autoAdvance: false, signalByValue: signal("none", "mild", "moderate", "marked", "safety") }),
  question(33, "women", "\u8FC7\u53BB4\u5468\uFF0C\u9634\u9053\u5206\u6CCC\u7269\u662F\u5426\u51FA\u73B0\u660E\u663E\u5F02\u5E38\uFF1F", "multi", ["\u6CA1\u6709\u660E\u663E\u5F02\u5E38", "\u5206\u6CCC\u7269\u660E\u663E\u589E\u591A", "\u6709\u660E\u663E\u5F02\u5473", "\u5916\u9634\u6216\u9634\u9053\u7619\u75D2", "\u53CD\u590D\u51FA\u73B0\u4E0D\u9002", "\u51FA\u73B0\u8840\u6027\u5206\u6CCC\u7269"], { tone: "safety", autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["0"], signalBySelectedValue: { "1": "mild", "2": "moderate", "3": "moderate", "4": "moderate", "5": "safety" } }),
  question(34, "women", "\u8FC7\u53BB4\u5468\uFF0C\u662F\u5426\u5B58\u5728\u9634\u9053\u5E72\u6DA9\u3001\u707C\u70ED\u6216\u6469\u64E6\u4E0D\u9002\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u6BD4\u8F83\u4E25\u91CD", "\u4E0D\u4FBF\u56DE\u7B54"], { signalByValue: signal("none", "mild", "moderate", "marked", "none") }),
  question(35, "women", "\u662F\u5426\u5B58\u5728\u56E0\u9634\u9053\u5E72\u6DA9\u6216\u75BC\u75DB\u5BFC\u81F4\u6027\u751F\u6D3B\u4E0D\u9002\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u5DF2\u660E\u663E\u5F71\u54CD\u751F\u6D3B", "\u65E0\u6027\u751F\u6D3B/\u4E0D\u9002\u7528", "\u4E0D\u4FBF\u56DE\u7B54"], { required: false, allowSkip: true, autoAdvance: false, signalByValue: signal("none", "mild", "moderate", "marked", "none", "none") }),
  question(36, "women", "\u8FC7\u53BB4\u5468\uFF0C\u662F\u5426\u5B58\u5728\u5C3F\u9891\u3001\u5C3F\u6025\u6216\u591C\u95F4\u8D77\u591C\u589E\u591A\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u975E\u5E38\u660E\u663E"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(37, "women", "\u54B3\u55FD\u3001\u5927\u7B11\u3001\u6253\u55B7\u568F\u3001\u8DD1\u8DF3\u6216\u63D0\u91CD\u7269\u65F6\u662F\u5426\u4F1A\u6F0F\u5C3F\uFF1F", "single", ["\u4ECE\u4E0D", "\u5076\u5C14", "\u7ECF\u5E38", "\u51E0\u4E4E\u6BCF\u6B21\u90FD\u4F1A"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(38, "women", "\u8FC7\u53BB12\u4E2A\u6708\u662F\u5426\u53CD\u590D\u51FA\u73B0\u5C3F\u8DEF\u611F\u67D3\u6216\u6392\u5C3F\u75BC\u75DB\u3001\u70E7\u707C\u611F\uFF1F", "single", ["\u6CA1\u6709", "1\u6B21", "2\u6B21", "3\u6B21\u53CA\u4EE5\u4E0A", "\u4E0D\u6E05\u695A"], { signalByValue: signal("none", "mild", "moderate", "marked", "mild") }),
  question(39, "women", "\u60A8\u6700\u8FD1\u4E00\u6B21\u5BAB\u9888\u7B5B\u67E5\u8DDD\u4ECA\u591A\u4E45\uFF1F", "single", ["1\u5E74\u4EE5\u5185", "1\u20143\u5E74", "3\u20145\u5E74", "\u8D85\u8FC75\u5E74", "\u4ECE\u672A\u505A\u8FC7", "\u5B50\u5BAB/\u5BAB\u9888\u5DF2\u5207\u9664", "\u4E0D\u6E05\u695A"]),
  question(40, "women", "\u60A8\u6700\u8FD1\u4E00\u6B21\u4E73\u817A\u5F71\u50CF\u68C0\u67E5\u8DDD\u4ECA\u591A\u4E45\uFF1F", "single", ["1\u5E74\u4EE5\u5185", "1\u20142\u5E74", "\u8D85\u8FC72\u5E74", "\u4ECE\u672A\u505A\u8FC7", "\u4E0D\u6E05\u695A"]),
  question(41, "gut", "\u8FC7\u53BB4\u5468\uFF0C\u60A8\u7684\u6392\u4FBF\u72B6\u6001\u6700\u7B26\u5408\u54EA\u4E00\u79CD\uFF1F", "single", ["\u57FA\u672C\u89C4\u5F8B\uFF0C\u6CA1\u6709\u660E\u663E\u4E0D\u9002", "\u7ECF\u5E38\u4FBF\u79D8\u6216\u6392\u4FBF\u8D39\u529B", "\u7ECF\u5E38\u5927\u4FBF\u504F\u7A00\u6216\u8179\u6CFB", "\u4FBF\u79D8\u4E0E\u8179\u6CFB\u4EA4\u66FF", "\u6392\u4FBF\u6B21\u6570\u6216\u6027\u72B6\u53D8\u5316\u8F83\u5927"], { signalByValue: signal("none", "moderate", "moderate", "marked", "moderate") }),
  question(42, "gut", "\u8FC7\u53BB4\u5468\uFF0C\u8179\u80C0\u3001\u6392\u6C14\u589E\u591A\u6216\u8179\u90E8\u4E0D\u8212\u670D\u7684\u60C5\u51B5\u5982\u4F55\uFF1F", "single", ["\u57FA\u672C\u6CA1\u6709", "\u5076\u5C14", "\u7ECF\u5E38", "\u51E0\u4E4E\u6BCF\u5929"], { signalByValue: signal("none", "mild", "moderate", "marked") }),
  question(43, "gut", "\u67D0\u4E9B\u98DF\u7269\u5403\u540E\u662F\u5426\u7279\u522B\u5BB9\u6613\u51FA\u73B0\u8179\u80C0\u3001\u8179\u6CFB\u3001\u8179\u75DB\u6216\u5176\u4ED6\u4E0D\u9002\uFF1F", "single", ["\u6CA1\u6709\u660E\u663E\u611F\u89C9", "\u5076\u5C14", "\u6709\u660E\u786E\u7684\u51E0\u7C7B\u98DF\u7269", "\u5F88\u591A\u98DF\u7269\u90FD\u4F1A\u4E0D\u8212\u670D", "\u4E0D\u6E05\u695A"], { signalByValue: signal("none", "mild", "moderate", "marked", "mild") }),
  question(44, "gut", "\u6700\u8FD1\u662F\u5426\u51FA\u73B0\u4FBF\u8840\u3001\u9ED1\u4FBF\u6216\u6392\u4FBF\u4E60\u60EF\u6301\u7EED\u660E\u663E\u6539\u53D8\uFF1F", "single", ["\u6CA1\u6709", "\u5076\u5C14\u6709\u4FBF\u8840", "\u66FE\u51FA\u73B0\u9ED1\u4FBF", "\u6392\u4FBF\u4E60\u60EF\u6301\u7EED\u6539\u53D8\u8D85\u8FC72\u5468", "\u540C\u65F6\u4F34\u6709\u660E\u663E\u6D88\u7626\u6216\u8179\u75DB", "\u4E0D\u786E\u5B9A"], { tone: "safety", autoAdvance: false, signalByValue: signal("none", "safety", "safety", "safety", "safety", "moderate") }),
  question(45, "gut", "\u8FC7\u53BB3\u4E2A\u6708\u662F\u5426\u4F7F\u7528\u8FC7\u4EE5\u4E0B\u4EA7\u54C1\u6216\u836F\u7269\uFF1F", "multi", ["\u6297\u751F\u7D20", "\u6CFB\u836F", "\u80C3\u80A0\u52A8\u529B\u836F", "\u76CA\u751F\u83CC", "\u76CA\u751F\u5143/\u81B3\u98DF\u7EA4\u7EF4\u8865\u5145\u5242", "\u51CF\u91CD\u836F\u7269", "\u4EE5\u4E0A\u5747\u65E0", "\u4E0D\u6E05\u695A"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["6", "7"] }),
  question(46, "history", "\u60A8\u76EE\u524D\u7684\u8FD0\u52A8\u72B6\u6001\u6700\u7B26\u5408\u54EA\u4E00\u79CD\uFF1F", "single", ["\u6BCF\u5468\u89C4\u5F8B\u8FD0\u52A83\u6B21\u53CA\u4EE5\u4E0A\uFF0C\u5E76\u5305\u542B\u529B\u91CF\u8BAD\u7EC3", "\u6BCF\u5468\u8FD0\u52A83\u6B21\u53CA\u4EE5\u4E0A\uFF0C\u4F46\u57FA\u672C\u6CA1\u6709\u529B\u91CF\u8BAD\u7EC3", "\u6BCF\u5468\u8FD0\u52A81\u20142\u6B21", "\u5076\u5C14\u6D3B\u52A8\uFF0C\u6CA1\u6709\u89C4\u5F8B\u8FD0\u52A8", "\u57FA\u672C\u4E0D\u8FD0\u52A8"], { signalByValue: signal("none", "mild", "mild", "moderate", "marked") }),
  question(47, "history", "\u60A8\u76EE\u524D\u65E5\u5E38\u996E\u98DF\u6700\u7B26\u5408\u54EA\u4E9B\u60C5\u51B5\uFF1F", "multi", ["\u6BCF\u5929\u57FA\u672C\u80FD\u5403\u5230\u591A\u79CD\u852C\u83DC", "\u7ECF\u5E38\u5403\u6C34\u679C", "\u7ECF\u5E38\u5403\u5168\u8C37\u7269\u6216\u6742\u7CAE", "\u7ECF\u5E38\u5403\u8C46\u7C7B\u6216\u8C46\u5236\u54C1", "\u7ECF\u5E38\u5403\u9C7C\u7C7B", "\u7EA2\u8089\u6216\u52A0\u5DE5\u8089\u8F83\u591A", "\u751C\u54C1\u3001\u542B\u7CD6\u996E\u6599\u8F83\u591A", "\u5916\u5356\u3001\u5916\u98DF\u8F83\u591A", "\u996E\u98DF\u6BD4\u8F83\u5355\u4E00", "\u5F88\u96BE\u5224\u65AD"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["9"], signalBySelectedValue: { "5": "mild", "6": "mild", "7": "mild", "8": "moderate" } }),
  question(48, "history", "\u60A8\u76EE\u524D\u5438\u70DF\u548C\u996E\u9152\u60C5\u51B5\u5982\u4F55\uFF1F", "multi", ["\u4E0D\u5438\u70DF", "\u76EE\u524D\u5438\u70DF", "\u5DF2\u7ECF\u6212\u70DF", "\u57FA\u672C\u4E0D\u996E\u9152", "\u5076\u5C14\u996E\u9152", "\u6BCF\u5468\u996E\u91522\u6B21\u53CA\u4EE5\u4E0A"], { autoAdvance: false, minSelections: 2, signalBySelectedValue: { "1": "moderate", "5": "moderate" } }),
  question(49, "history", "\u533B\u751F\u662F\u5426\u66FE\u7ECF\u544A\u8BC9\u60A8\u5B58\u5728\u4EE5\u4E0B\u5065\u5EB7\u95EE\u9898\uFF1F", "multi", ["\u9AD8\u8840\u538B", "\u8840\u7CD6\u504F\u9AD8\u6216\u7CD6\u5C3F\u75C5", "\u8840\u8102\u5F02\u5E38", "\u8102\u80AA\u809D", "\u7532\u72B6\u817A\u75BE\u75C5", "\u9AD8\u5C3F\u9178", "\u9AA8\u91CF\u51CF\u5C11\u6216\u9AA8\u8D28\u758F\u677E", "\u4E73\u817A\u75BE\u75C5", "\u5B50\u5BAB\u6216\u5375\u5DE2\u75BE\u75C5", "\u5FC3\u8111\u8840\u7BA1\u75BE\u75C5", "\u81EA\u8EAB\u514D\u75AB\u6216\u98CE\u6E7F\u514D\u75AB\u75BE\u75C5", "\u80BE\u810F\u75BE\u75C5", "\u6076\u6027\u80BF\u7624", "\u4EE5\u4E0A\u5747\u65E0", "\u4E0D\u6E05\u695A"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["13", "14"] }),
  question(50, "history", "\u60A8\u76EE\u524D\u662F\u5426\u957F\u671F\u4F7F\u7528\u4EE5\u4E0B\u836F\u7269\u6216\u8865\u5145\u5242\uFF1F", "multi", ["\u964D\u538B\u836F", "\u964D\u7CD6\u836F", "\u964D\u8102\u836F", "\u7532\u72B6\u817A\u76F8\u5173\u836F\u7269", "\u6FC0\u7D20\u7C7B\u836F\u7269", "\u7CD6\u76AE\u8D28\u6FC0\u7D20", "\u9AA8\u8D28\u758F\u677E\u76F8\u5173\u836F\u7269", "\u6297\u51DD/\u6297\u8840\u5C0F\u677F\u836F\u7269", "\u51CF\u91CD\u836F\u7269", "\u9499\u6216\u7EF4\u751F\u7D20D", "\u5176\u4ED6\u8425\u517B\u8865\u5145\u5242", "\u6CA1\u6709\u957F\u671F\u4F7F\u7528", "\u4E0D\u6E05\u695A"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["11", "12"] }),
  question(51, "history", "\u60A8\u7684\u76F4\u7CFB\u4EB2\u5C5E\u4E2D\u662F\u5426\u6709\u4EBA\u5B58\u5728\u4EE5\u4E0B\u60C5\u51B5\uFF1F", "multi", ["\u4E73\u817A\u764C", "\u5375\u5DE2\u764C", "\u5B50\u5BAB\u5185\u819C\u764C", "\u7ED3\u76F4\u80A0\u764C", "\u7CD6\u5C3F\u75C5", "\u8F83\u5E74\u8F7B\u65F6\u53D1\u751F\u5FC3\u808C\u6897\u6B7B\u6216\u8111\u5352\u4E2D", "\u9AA8\u8D28\u758F\u677E\u6216\u9ACB\u90E8\u9AA8\u6298", "\u4EE5\u4E0A\u5747\u65E0", "\u4E0D\u6E05\u695A"], { autoAdvance: false, minSelections: 1, mutuallyExclusiveValues: ["7", "8"] }),
  question(52, "history", "\u60A8\u662F\u5426\u505A\u8FC7\u7ED3\u76F4\u80A0\u764C\u76F8\u5173\u7B5B\u67E5\uFF1F", "single", ["\u8FD11\u5E74\u505A\u8FC7\u5927\u4FBF\u6F5C\u8840\u7B49\u7CAA\u4FBF\u68C0\u67E5", "\u8FD15\u5E74\u505A\u8FC7\u80A0\u955C", "5\u201410\u5E74\u524D\u505A\u8FC7\u80A0\u955C", "10\u5E74\u4EE5\u4E0A\u524D\u505A\u8FC7", "\u4ECE\u672A\u505A\u8FC7", "\u4E0D\u6E05\u695A"]),
  question(53, "priorities", "\u5982\u679C\u8FD9\u6B21\u5065\u5EB7\u4F53\u68C0\u53EF\u4EE5\u91CD\u70B9\u5E2E\u60A8\u89E3\u51B3\u95EE\u9898\uFF0C\u60A8\u6700\u5E0C\u671B\u5173\u6CE8\u54EA\u4E9B\u65B9\u9762\uFF1F", "multi", ["\u5973\u6027\u6FC0\u7D20\u4E0E\u56F4\u7EDD\u7ECF\u671F\u53D8\u5316", "\u7761\u7720", "\u60C5\u7EEA\u4E0E\u538B\u529B", "\u8BB0\u5FC6\u529B\u4E0E\u6CE8\u610F\u529B", "\u4F53\u91CD\u4E0E\u8170\u8179\u8102\u80AA", "\u8840\u7CD6\u3001\u8840\u8102\u7B49\u4EE3\u8C22\u95EE\u9898", "\u5FC3\u8111\u8840\u7BA1\u5065\u5EB7", "\u7532\u72B6\u817A\u5065\u5EB7", "\u4E73\u817A\u5065\u5EB7", "\u5987\u79D1\u5065\u5EB7", "\u9634\u9053\u53CA\u6CCC\u5C3F\u5065\u5EB7", "\u9AA8\u8D28\u758F\u677E", "\u808C\u8089\u4E0E\u4F53\u80FD", "\u80A0\u9053\u4E0E\u6392\u4FBF", "\u80A0\u9053\u5FAE\u751F\u6001", "\u514D\u75AB\u4E0E\u708E\u75C7", "\u8870\u8001\u901F\u5EA6\u4E0E\u5065\u5EB7\u5BFF\u547D", "\u5E0C\u671B\u8FDB\u884C\u4E00\u6B21\u7CFB\u7EDF\u7684\u7EFC\u5408\u8BC4\u4F30"], { autoAdvance: false, minSelections: 1, maxSelections: 3, subtitle: "\u6700\u591A\u9009\u62E93\u9879" }),
  question(54, "overall", "\u5982\u679C\u4EE51\u5E74\u524D\u7684\u81EA\u5DF1\u4F5C\u4E3A\u53C2\u7167\uFF0C\u60A8\u89C9\u5F97\u76EE\u524D\u6574\u4F53\u8EAB\u4F53\u72B6\u6001\u5982\u4F55\uFF1F", "single", ["\u6BD41\u5E74\u524D\u66F4\u597D", "\u57FA\u672C\u6CA1\u6709\u53D8\u5316", "\u7A0D\u6709\u4E0B\u964D", "\u660E\u663E\u4E0B\u964D", "\u4E0B\u964D\u5F88\u591A"], { signalByValue: signal("none", "none", "mild", "moderate", "marked") }),
  question(55, "overall", "\u5982\u679C\u75280\u201410\u5206\u8BC4\u4EF7\u76EE\u524D\u6574\u4F53\u5065\u5EB7\u72B6\u6001\uFF0C\u60A8\u4F1A\u7ED9\u81EA\u5DF1\u591A\u5C11\u5206\uFF1F", "scale", [], { autoAdvance: false, helper: "0\u5206\uFF1A\u975E\u5E38\u5DEE \xB7 10\u5206\uFF1A\u975E\u5E38\u597D" })
];
var questionsByModule = /* @__PURE__ */ new Map();
for (const page2 of q) questionsByModule.set(page2.moduleId, [...questionsByModule.get(page2.moduleId) ?? [], page2]);
var pages2 = [];
for (const module2 of femaleModules) {
  if (module2.index >= 2 && module2.index <= 8) {
    pages2.push({ id: `intro:${module2.id}`, kind: "intro", moduleId: module2.id, title: module2.introTitle, description: module2.introDescription, icon: module2.icon });
  }
  pages2.push(...questionsByModule.get(module2.id) ?? []);
}
var femaleSurvey = { version: "female-health-v1.0", modules: femaleModules, pages: pages2 };
function findFemaleQuestion(id) {
  const page2 = femaleSurvey.pages.find((item) => item.kind === "question" && item.id === id);
  return page2?.kind === "question" ? page2.question : void 0;
}

// src/female/assessment.ts
var domains = [
  { id: "femaleLifecycle", title: "\u5973\u6027\u751F\u547D\u5468\u671F", questionIds: ["f5", "f6", "f7", "f8", "f9", "f10", "f11"], recommendation: "\u5EFA\u8BAE\u7ED3\u5408\u751F\u547D\u5468\u671F\u9636\u6BB5\u548C\u5B9E\u9645\u4F53\u611F\uFF0C\u7531\u533B\u52A1\u4EBA\u5458\u5224\u65AD\u662F\u5426\u9700\u8981\u5973\u6027\u6FC0\u7D20\u6216\u5987\u79D1\u65B9\u5411\u8BC4\u4F30\u3002" },
  { id: "sleep", title: "\u7761\u7720\u72B6\u6001", questionIds: ["f12", "f13", "f14", "f15", "f25"], recommendation: "\u5EFA\u8BAE\u8FDB\u4E00\u6B65\u4E86\u89E3\u7761\u7720\u65F6\u957F\u3001\u7761\u7720\u8D28\u91CF\u53CA\u7761\u7720\u547C\u5438\u76F8\u5173\u98CE\u9669\u3002" },
  { id: "mind", title: "\u60C5\u7EEA\u4E0E\u8BA4\u77E5", questionIds: ["f16", "f17", "f18", "f19"], recommendation: "\u5EFA\u8BAE\u7ED3\u5408\u7761\u7720\u3001\u538B\u529B\u4E0E\u751F\u6D3B\u5F71\u54CD\u7A0B\u5EA6\uFF0C\u8FDB\u4E00\u6B65\u5B8C\u6210\u60C5\u7EEA\u548C\u8BA4\u77E5\u72B6\u6001\u8BC4\u4F30\u3002" },
  { id: "metabolicCardio", title: "\u4EE3\u8C22\u4E0E\u5FC3\u8840\u7BA1\u4F53\u611F", questionIds: ["f20", "f21", "f22", "f23", "f24", "f26", "f48"], recommendation: "\u5EFA\u8BAE\u7ED3\u5408\u8840\u538B\u3001\u8840\u7CD6\u3001\u8840\u8102\u3001\u4F53\u6210\u5206\u53CA\u5FC3\u8840\u7BA1\u98CE\u9669\u56E0\u7D20\u8FDB\u4E00\u6B65\u8BC4\u4F30\u3002" },
  { id: "musculoskeletal", title: "\u9AA8\u9ABC\u3001\u808C\u8089\u4E0E\u529F\u80FD\u50A8\u5907", questionIds: ["f27", "f28", "f29", "f30", "f46"], recommendation: "\u5EFA\u8BAE\u7ED3\u5408\u9AA8\u5BC6\u5EA6\u3001\u808C\u8089\u91CF\u3001\u63E1\u529B\u548C\u57FA\u7840\u8FD0\u52A8\u80FD\u529B\u8FDB\u4E00\u6B65\u8BC4\u4F30\u3002" },
  { id: "breastGynecology", title: "\u4E73\u817A\u4E0E\u5987\u79D1\u5065\u5EB7\u7EBF\u7D22", questionIds: ["f31", "f32", "f33"], recommendation: "\u5EFA\u8BAE\u7ED3\u5408\u75C7\u72B6\u3001\u65E2\u5F80\u8D44\u6599\u53CA\u533B\u52A1\u4EBA\u5458\u5224\u65AD\u5B89\u6392\u4E73\u817A\u6216\u5987\u79D1\u4E13\u9879\u8BC4\u4F30\u3002" },
  { id: "urogenital", title: "\u6CCC\u5C3F\u751F\u6B96\u72B6\u6001", questionIds: ["f34", "f35", "f36", "f37", "f38"], recommendation: "\u5EFA\u8BAE\u8FDB\u4E00\u6B65\u4E86\u89E3\u6CCC\u5C3F\u751F\u6B96\u4F53\u611F\u53CA\u5176\u5BF9\u65E5\u5E38\u751F\u6D3B\u7684\u5F71\u54CD\u3002" },
  { id: "gutLifestyle", title: "\u80C3\u80A0\u3001\u5FAE\u751F\u6001\u4E0E\u751F\u6D3B\u65B9\u5F0F", questionIds: ["f41", "f42", "f43", "f44", "f45", "f47"], recommendation: "\u5EFA\u8BAE\u7ED3\u5408\u6392\u4FBF\u3001\u996E\u98DF\u3001\u7528\u836F\u53CA\u751F\u6D3B\u65B9\u5F0F\u7EBF\u7D22\u8FDB\u4E00\u6B65\u8BC4\u4F30\uFF1B\u95EE\u5377\u4E0D\u5224\u65AD\u83CC\u7FA4\u72B6\u6001\u3002" }
];
function selectedSignals(answers, questionId) {
  const question2 = findFemaleQuestion(questionId);
  const value3 = answers[questionId];
  if (!question2 || value3 === void 0 || value3 === null || value3 === "__skip__") return [];
  if (Array.isArray(value3)) return value3.map((item) => question2.signalBySelectedValue?.[item] ?? "none");
  return [question2.signalByValue?.[String(value3)] ?? "none"];
}
function levelFromSignals(signals) {
  const relevant = signals.filter((item) => item !== "none");
  if (relevant.includes("safety")) return "clinical_priority";
  if (relevant.some((item) => item === "moderate" || item === "marked")) return "evaluate";
  return relevant.filter((item) => item === "mild").length >= 2 ? "evaluate" : relevant.length === 1 ? "signal" : "stable";
}
function reasonForLevel(level) {
  if (level === "evaluate") return "\u76F8\u5173\u4F53\u611F\u51FA\u73B0\u8F83\u660E\u786E\u53D8\u5316\uFF0C\u5EFA\u8BAE\u7ED3\u5408\u5BA2\u89C2\u8D44\u6599\u8FDB\u4E00\u6B65\u8BC4\u4F30";
  if (level === "signal") return "\u76F8\u5173\u4F53\u611F\u5B58\u5728\u8F7B\u5FAE\u53D8\u5316\u4FE1\u53F7";
  return "\u5F53\u524D\u76F8\u5173\u4F53\u611F\u57FA\u672C\u7A33\u5B9A";
}
function screeningAttention(answers) {
  const attention = [];
  if (["3", "4", "6"].includes(String(answers.f39 ?? ""))) attention.push("\u5BAB\u9888\u7B5B\u67E5\u5B89\u6392\u53EF\u4E0E\u533B\u52A1\u4EBA\u5458\u8FDB\u4E00\u6B65\u786E\u8BA4");
  if (["2", "3", "4"].includes(String(answers.f40 ?? ""))) attention.push("\u4E73\u817A\u5F71\u50CF\u68C0\u67E5\u5B89\u6392\u53EF\u4E0E\u533B\u52A1\u4EBA\u5458\u8FDB\u4E00\u6B65\u786E\u8BA4");
  if (["2", "3", "4", "5"].includes(String(answers.f52 ?? ""))) attention.push("\u7ED3\u76F4\u80A0\u7B5B\u67E5\u5B89\u6392\u53EF\u4E0E\u533B\u52A1\u4EBA\u5458\u8FDB\u4E00\u6B65\u786E\u8BA4");
  return attention;
}
function assessFemaleSurvey(answers) {
  const redFlags = Array.from(new Set(
    domains.flatMap((definition) => definition.questionIds.filter((id) => selectedSignals(answers, id).includes("safety")))
  ));
  let assessedDomains = domains.map((definition) => {
    const signals = definition.questionIds.flatMap((id) => selectedSignals(answers, id));
    const level = levelFromSignals(signals);
    return {
      id: definition.id,
      title: definition.title,
      level,
      reasons: [reasonForLevel(level)],
      recommendation: level === "stable" ? "\u5EFA\u8BAE\u4FDD\u6301\u5F53\u524D\u6709\u5229\u4E60\u60EF\uFF0C\u5E76\u7ED3\u5408\u540E\u7EED\u4F53\u68C0\u6301\u7EED\u89C2\u5BDF\u53D8\u5316\u3002" : definition.recommendation
    };
  });
  if (redFlags.length) {
    assessedDomains = assessedDomains.map((item) => ({
      ...item,
      level: "clinical_priority",
      reasons: ["\u533B\u5B66\u5B89\u5168\u4FE1\u606F\u9700\u8981\u533B\u52A1\u4EBA\u5458\u4F18\u5148\u6838\u5B9E"],
      recommendation: "\u8BF7\u5148\u7531\u533B\u52A1\u4EBA\u5458\u5B8C\u6210\u4FE1\u606F\u6838\u5B9E\u4E0E\u98CE\u9669\u5224\u65AD\uFF0C\u518D\u51B3\u5B9A\u540E\u7EED\u5065\u5EB7\u7BA1\u7406\u8DEF\u5F84\u3002"
    }));
  }
  return {
    domains: assessedDomains,
    hasRedFlag: redFlags.length > 0,
    redFlags,
    screeningAttention: screeningAttention(answers)
  };
}

// src/female/navigation.ts
function isVisible2(question2, answers) {
  const rule = question2.visibleWhen;
  if (!rule) return true;
  const answer = answers[rule.questionId];
  if (rule.operator === "includes") return Array.isArray(answer) && rule.values.some((value3) => answer.includes(value3));
  if (rule.operator === "notEquals") return !rule.values.includes(String(answer ?? ""));
  return rule.values.includes(String(answer ?? ""));
}
function getVisibleFemalePages(answers) {
  return femaleSurvey.pages.filter((page2) => page2.kind === "intro" || isVisible2(page2.question, answers));
}
function pruneHiddenFemaleAnswers(answers) {
  const visibleIds = new Set(getVisibleFemalePages(answers).map((page2) => page2.id));
  const next = { ...answers };
  for (const page2 of femaleSurvey.pages) {
    if (page2.kind === "question" && page2.question.visibleWhen && !visibleIds.has(page2.id)) delete next[page2.id];
  }
  return next;
}

// src/female/normalize.ts
var questionIds2 = new Set(
  femaleSurvey.pages.filter((page2) => page2.kind === "question").map((page2) => page2.id)
);
var ageByBand = { "0": 42, "1": 47, "2": 52, "3": 57, "4": 62, "5": 67, "6": 70 };
function normalizeFemaleAnswers(input) {
  const answers = pruneHiddenFemaleAnswers(input);
  const healthAnswers = {};
  for (const [id, value3] of Object.entries(answers)) {
    if (questionIds2.has(id) && id !== "f1" && id !== "f2") healthAnswers[id] = value3;
  }
  const privateValue = answers.f35;
  if (privateValue === "__skip__" || privateValue === void 0 || privateValue === null || privateValue === "") {
    healthAnswers.f35 = null;
    healthAnswers.sensitiveAnswers = { f35: { answered: false, value: null } };
  } else {
    healthAnswers.sensitiveAnswers = { f35: { answered: true, value: String(privateValue) } };
  }
  const assessmentAnswers = Object.fromEntries(
    Object.entries(healthAnswers).filter(([, value3]) => value3 === null || typeof value3 === "string" || typeof value3 === "number" || Array.isArray(value3))
  );
  const phone = String(answers.f2 ?? "");
  return {
    identity: {
      name: String(answers.f1 ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 80),
      phone,
      phoneLast4: phone.slice(-4),
      age: ageByBand[String(answers.f4 ?? "")] ?? null
    },
    healthAnswers,
    assessmentAnswers
  };
}

// src/female/validation.ts
var isEmpty3 = (value3) => value3 === void 0 || value3 === null || value3 === "" || Array.isArray(value3) && value3.length === 0;
function isValidDate(value3) {
  const text = String(value3 ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
function validateFemaleQuestion(question2, answers) {
  const value3 = answers[question2.id];
  if (question2.allowSkip && value3 === "__skip__") return void 0;
  if (isEmpty3(value3)) {
    if (!question2.required || question2.allowSkip) return void 0;
    if (question2.type === "multi") return `\u8BF7\u81F3\u5C11\u9009\u62E9${question2.minSelections ?? 1}\u9879`;
    return question2.type === "text" || question2.type === "phone" ? "\u8BF7\u586B\u5199\u6B64\u9879" : "\u8BF7\u9009\u62E9\u4E00\u9879";
  }
  if (question2.id === "f1" && !String(value3).trim()) return "\u8BF7\u586B\u5199\u59D3\u540D";
  if (question2.type === "phone" && !/^1[3-9]\d{9}$/.test(String(value3))) return "\u8BF7\u8F93\u5165\u6709\u6548\u768411\u4F4D\u4E2D\u56FD\u5927\u9646\u624B\u673A\u53F7\u7801";
  if (question2.type === "date" && !isValidDate(value3)) return "\u586B\u5199\u65E5\u671F\u65E0\u6548";
  if (question2.type === "scale") {
    const score2 = Number(value3);
    if (!Number.isInteger(score2) || score2 < 0 || score2 > 10) return "\u8BF7\u9009\u62E90\u201410\u4E4B\u95F4\u7684\u6574\u6570";
  }
  const optionValues = new Set(question2.options?.map((option) => option.value) ?? []);
  if (question2.type === "single" && !optionValues.has(String(value3))) return "\u8BF7\u9009\u62E9\u6709\u6548\u9009\u9879";
  if (question2.type === "multi") {
    if (!Array.isArray(value3)) return "\u8BF7\u9009\u62E9\u81F3\u5C11\u4E00\u9879";
    if (value3.some((item) => !optionValues.has(item))) return "\u8BF7\u9009\u62E9\u6709\u6548\u9009\u9879";
    if (question2.minSelections && value3.length < question2.minSelections) return `\u8BF7\u81F3\u5C11\u9009\u62E9${question2.minSelections}\u9879`;
    if (question2.maxSelections && value3.length > question2.maxSelections) return `\u6700\u591A\u9009\u62E9${question2.maxSelections}\u9879`;
    const exclusive = question2.mutuallyExclusiveValues ?? [];
    if (value3.some((item) => exclusive.includes(item)) && value3.length > 1) return "\u201C\u65E0\u201D\u6216\u201C\u4E0D\u6E05\u695A\u201D\u4E0D\u80FD\u4E0E\u5176\u4ED6\u9009\u9879\u540C\u65F6\u9009\u62E9";
  }
  if (question2.id === "f48" && Array.isArray(value3)) {
    if (!value3.some((item) => ["0", "1", "2"].includes(item))) return "\u8BF7\u9009\u62E9\u4E00\u9879\u5438\u70DF\u60C5\u51B5";
    if (!value3.some((item) => ["3", "4", "5"].includes(item))) return "\u8BF7\u9009\u62E9\u4E00\u9879\u996E\u9152\u60C5\u51B5";
    if (value3.filter((item) => ["0", "1", "2"].includes(item)).length > 1) return "\u5438\u70DF\u60C5\u51B5\u53EA\u80FD\u9009\u62E9\u4E00\u9879";
    if (value3.filter((item) => ["3", "4", "5"].includes(item)).length > 1) return "\u996E\u9152\u60C5\u51B5\u53EA\u80FD\u9009\u62E9\u4E00\u9879";
  }
  return void 0;
}
function validateFemaleSubmission(answers) {
  const errors = {};
  for (const page2 of getVisibleFemalePages(answers)) {
    if (page2.kind !== "question") continue;
    const error = validateFemaleQuestion(page2.question, answers);
    if (error) errors[page2.id] = error;
  }
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
  ...maleHealthV1.sections.flatMap((section) => section.questions.map((question2) => question2.id)),
  ...hospitalSurvey.pages.filter((page2) => page2.kind === "question").map((page2) => page2.id),
  ...femaleSurvey.pages.filter((page2) => page2.kind === "question").map((page2) => page2.id),
  "date"
]);
var supportedQuestionnaireVersions = /* @__PURE__ */ new Set([
  maleHealthV1.version,
  "nuoma-yuanyi-male-health-v1.0",
  femaleSurvey.version
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
  for (const [key, value3] of Object.entries(payload.answers)) {
    if (!allowedAnswerIds.has(key)) continue;
    if (typeof value3 === "string" && value3.length > 2e3) throw new SubmissionError("INVALID_PAYLOAD", "\u6587\u672C\u5185\u5BB9\u8D85\u51FA\u9650\u5236");
    if (Array.isArray(value3) && (value3.length > 20 || value3.some((item) => typeof item !== "string" || item.length > 80))) {
      throw new SubmissionError("INVALID_PAYLOAD", "\u9009\u9879\u5185\u5BB9\u683C\u5F0F\u4E0D\u6B63\u786E");
    }
  }
  const femalePayload = payload.questionnaireVersion === femaleSurvey.version;
  const mobileHospitalPayload = !femalePayload && typeof payload.answers.phone === "string";
  const errors = femalePayload ? Object.values(validateFemaleSubmission(payload.answers)) : mobileHospitalPayload ? Object.values(validateHospitalSubmission(payload.answers)) : maleHealthV1.sections.flatMap((section) => Object.values(validateStep(section.id, payload.answers)));
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
      const femalePayload = payload.questionnaireVersion === femaleSurvey.version;
      const mobileHospitalPayload = !femalePayload && typeof payload.answers.phone === "string";
      let identity;
      let healthAnswers;
      let assessmentAnswers;
      if (femalePayload) {
        const normalized = normalizeFemaleAnswers(payload.answers);
        identity = normalized.identity;
        healthAnswers = normalized.healthAnswers;
        assessmentAnswers = normalized.assessmentAnswers;
      } else if (mobileHospitalPayload) {
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
      const assessment = femalePayload ? assessFemaleSurvey(assessmentAnswers) : assessSurvey(assessmentAnswers);
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

// functions/submitSurvey/src/report-model.ts
var levelLabels = {
  clinical_priority: "\u4F18\u5148\u4E34\u5E8A\u6838\u5B9E",
  evaluate: "\u5EFA\u8BAE\u8FDB\u4E00\u6B65\u8BC4\u4F30",
  signal: "\u5B58\u5728\u53D8\u5316\u4FE1\u53F7",
  stable: "\u57FA\u672C\u7A33\u5B9A"
};
var questionLabels = (id) => new Map(
  findHospitalQuestion(id)?.options?.map((option) => [option.value, option.label]) ?? []
);
var topConcernLabels = questionLabels("topConcerns");
var mainChangeLabels = questionLabels("mainChange");
var twelveWeekGoalLabels = questionLabels("twelveWeekGoals");
function safeText(value3, fallback = "\u672A\u586B\u5199", maxLength = 160) {
  const text = String(value3 ?? "").replace(/[\u0000-\u001f\u007f<>`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
  return text || fallback;
}
function mappedAnswer(record, id) {
  return questionLabels(id).get(String(record.healthAnswers[id] ?? "")) ?? "\u672A\u586B\u5199";
}
function mappedMulti(record, id, labels2 = questionLabels(id)) {
  const value3 = record.healthAnswers[id];
  if (!Array.isArray(value3)) return [];
  return [...new Set(value3.map(String))].map((item) => labels2.get(item)).filter((item) => Boolean(item)).map((item) => safeText(item));
}
function formattedSubmittedAt(value3) {
  const date = new Date(value3);
  if (Number.isNaN(date.getTime())) return "\u65F6\u95F4\u5F85\u6838\u5B9E";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}\u5E74${parts.month}\u6708${parts.day}\u65E5 ${parts.hour}:${parts.minute}`;
}
function followUpLabel(record) {
  if (record.session.hasRedFlag) return "\u9700\u533B\u52A1\u4EBA\u5458\u4F18\u5148\u6838\u5B9E";
  const evaluate = record.assessment.domains.filter(({ level }) => level === "evaluate").length;
  const signal2 = record.assessment.domains.filter(({ level }) => level === "signal").length;
  if (evaluate >= 2) return "\u5EFA\u8BAE\u91CD\u70B9\u8DDF\u8FDB";
  if (evaluate + signal2 > 0) return "\u5B58\u5728\u53D8\u5316\u4FE1\u53F7";
  return "\u5E38\u89C4\u5065\u5EB7\u7BA1\u7406";
}
function primaryGoal(record) {
  const selected = record.healthAnswers.topConcerns;
  const goal = String(record.healthAnswers.singleImprovement ?? "");
  if (!Array.isArray(selected) || !selected.map(String).includes(goal)) return "\u672A\u586B\u5199";
  return topConcernLabels.get(goal) ?? "\u672A\u586B\u5199";
}
function buildHospitalClientReportModel(record) {
  const hasRedFlag = record.session.hasRedFlag || record.assessment.hasRedFlag;
  const counts = (level) => record.assessment.domains.filter((domain2) => domain2.level === level).length;
  const lifestyle = [
    { label: "\u804C\u4E1A\u72B6\u6001", value: mappedAnswer(record, "workStatus") },
    { label: "\u4E45\u5750\u65F6\u95F4", value: mappedAnswer(record, "q41") },
    { label: "\u4E2D\u7B49\u5F3A\u5EA6\u8FD0\u52A8", value: mappedAnswer(record, "q42") },
    { label: "\u529B\u91CF\u8BAD\u7EC3", value: mappedAnswer(record, "q43") },
    { label: "\u996E\u9152\u60C5\u51B5", value: mappedAnswer(record, "q44") },
    { label: "\u5438\u70DF\u60C5\u51B5", value: mappedAnswer(record, "q45") },
    { label: "\u665A\u95F4\u8FDB\u98DF", value: mappedAnswer(record, "q46") },
    { label: "\u89C4\u5F8B\u6444\u5165\u98DF\u7269", value: mappedMulti(record, "q47").join("\u3001") || "\u672A\u586B\u5199" }
  ];
  return {
    institution: "\u5EFA\u59CB\u6C11\u65CF\u533B\u9662",
    title: "\u7537\u6027\u5065\u5EB7\u4E0E\u529F\u80FD\u72B6\u6001\u8BC4\u4F30\u62A5\u544A",
    name: safeText(record.identity.name, "\u672A\u586B\u5199", 80),
    phone: /^1\d{10}$/.test(record.identity.phone ?? "") ? record.identity.phone : "\u672A\u63D0\u4F9B",
    confirmationId: safeText(record.session.confirmationId, "\u8BB0\u5F55\u7F16\u53F7\u5F85\u6838\u5B9E", 80),
    submittedAt: formattedSubmittedAt(record.session.submittedAt),
    followUpLabel: followUpLabel(record),
    concerns: mappedMulti(record, "topConcerns", topConcernLabels).slice(0, 3),
    mainChange: mainChangeLabels.get(String(record.healthAnswers.mainChange ?? "")) ?? "\u672A\u586B\u5199",
    primaryGoal: primaryGoal(record),
    statusCounts: { evaluate: counts("evaluate"), signal: counts("signal"), stable: counts("stable") },
    domains: record.assessment.domains.slice(0, 8).map((domain2) => ({
      title: safeText(domain2.title, "\u672A\u547D\u540D\u7EF4\u5EA6", 40),
      level: hasRedFlag ? "clinical_priority" : domain2.level,
      levelLabel: levelLabels[hasRedFlag ? "clinical_priority" : domain2.level],
      reason: hasRedFlag ? "\u5B89\u5168\u4FE1\u606F\u5F85\u4EBA\u5DE5\u6838\u5B9E" : safeText(domain2.reasons[0], "\u5F53\u524D\u672A\u53D1\u73B0\u660E\u663E\u53D8\u5316\u4FE1\u53F7", 100),
      recommendation: hasRedFlag ? "\u8BF7\u7531\u533B\u52A1\u4EBA\u5458\u5148\u5B8C\u6210\u4FE1\u606F\u6838\u5B9E\u4E0E\u98CE\u9669\u5224\u65AD\u3002" : safeText(domain2.recommendation, "\u5EFA\u8BAE\u4FDD\u6301\u5F53\u524D\u4E60\u60EF\u5E76\u6301\u7EED\u89C2\u5BDF\u53D8\u5316\u3002", 180)
    })),
    lifestyle,
    twelveWeekGoals: mappedMulti(record, "twelveWeekGoals", twelveWeekGoalLabels).slice(0, 3),
    safetyNotice: hasRedFlag ? "\u533B\u5B66\u5B89\u5168\u4FE1\u606F\u9700\u8981\u533B\u52A1\u4EBA\u5458\u4F18\u5148\u6838\u5B9E\uFF0C\u8BF7\u5148\u5B8C\u6210\u98CE\u9669\u5224\u65AD\uFF0C\u518D\u51B3\u5B9A\u5065\u5EB7\u7BA1\u7406\u8DEF\u5F84\u3002" : null
  };
}

// functions/submitSurvey/src/report-pdf.ts
var import_pdfkit = __toESM(require("pdfkit"));
var PAGE_WIDTH = 595.28;
var PAGE_HEIGHT = 841.89;
var MARGIN = 46;
var CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
var TOTAL_PAGES = 3;
var colors = {
  navy: "#0B2745",
  blue: "#1479B8",
  cyan: "#00A6A6",
  orange: "#F0783C",
  red: "#D9544D",
  green: "#159A7D",
  ink: "#17324D",
  muted: "#62778B",
  line: "#DCE7F0",
  pale: "#F3F8FC",
  white: "#FFFFFF"
};
var levelColor = (level) => ({
  clinical_priority: colors.red,
  evaluate: colors.orange,
  signal: colors.blue,
  stable: colors.green
})[level];
function safeFilenamePart(value3, maxLength) {
  return [...value3.replace(/[^\p{L}\p{N} _.\-]/gu, "").replace(/\s+/g, "")].slice(0, maxLength).join("") || "\u672A\u547D\u540D";
}
function hospitalClientReportFilename(model) {
  const name = safeFilenamePart(model.name, 24);
  const confirmationId2 = safeFilenamePart(model.confirmationId, 40);
  return `\u5EFA\u59CB\u6C11\u65CF\u533B\u9662_\u5065\u5EB7\u8BC4\u4F30\u62A5\u544A_${name}_${confirmationId2}.pdf`;
}
function roundedPanel(doc, x, y, width, height, fill = colors.white, stroke = colors.line, radius = 10) {
  doc.save().roundedRect(x, y, width, height, radius).fillAndStroke(fill, stroke).restore();
}
function label(doc, text, x, y, color = colors.muted) {
  doc.fontSize(8.5).fillColor(color).text(text, x, y, { lineBreak: false });
}
function value(doc, text, x, y, width, size = 11, color = colors.ink, height = 34) {
  doc.fontSize(size).fillColor(color).text(text, x, y, { width, height, ellipsis: true, lineGap: 2 });
}
function statusPill(doc, text, x, y, color, width = 104) {
  doc.save().roundedRect(x, y, width, 24, 12).fill(color).restore();
  doc.fontSize(9).fillColor(colors.white).text(text, x, y + 6, { width, align: "center", lineBreak: false });
}
function sectionTitle(doc, index, title, y, subtitle) {
  doc.save().circle(MARGIN + 10, y + 10, 10).fill(colors.blue).restore();
  doc.fontSize(9).fillColor(colors.white).text(index, MARGIN + 1, y + 5, { width: 18, align: "center", lineBreak: false });
  doc.fontSize(15).fillColor(colors.navy).text(title, MARGIN + 29, y + 2, { lineBreak: false });
  if (subtitle) {
    doc.fontSize(8.5).fillColor(colors.muted).text(subtitle, MARGIN + 29, y + 22, { width: CONTENT_WIDTH - 29 });
  }
}
function pageChrome(doc, model, pageNumber) {
  if (pageNumber > 1) {
    doc.save().rect(0, 0, PAGE_WIDTH, 8).fill(colors.cyan).restore();
    doc.fontSize(9).fillColor(colors.navy).text(model.institution, MARGIN, 26, { lineBreak: false });
    doc.fontSize(8.5).fillColor(colors.muted).text(model.title, MARGIN, 27, { width: CONTENT_WIDTH, align: "right", lineBreak: false });
    doc.save().moveTo(MARGIN, 49).lineTo(PAGE_WIDTH - MARGIN, 49).strokeColor(colors.line).stroke().restore();
  }
  doc.save().moveTo(MARGIN, PAGE_HEIGHT - 39).lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 39).strokeColor(colors.line).stroke().restore();
  doc.fontSize(7.5).fillColor(colors.muted).text(`\u8BB0\u5F55\u7F16\u53F7 ${model.confirmationId}`, MARGIN, PAGE_HEIGHT - 29, { lineBreak: false });
  doc.text(`\u7B2C ${pageNumber} / ${TOTAL_PAGES} \u9875`, PAGE_WIDTH - MARGIN - 80, PAGE_HEIGHT - 29, { width: 80, align: "right", lineBreak: false });
}
function drawCover(doc, model) {
  doc.save().rect(0, 0, PAGE_WIDTH, 175).fill(colors.navy).restore();
  doc.save().rect(0, 0, 10, 175).fill(colors.cyan).restore();
  doc.fontSize(12).fillColor("#9ADFE0").text(model.institution, MARGIN, 35, { lineBreak: false });
  doc.fontSize(25).fillColor(colors.white).text(model.title, MARGIN, 64, { width: CONTENT_WIDTH, lineBreak: false });
  doc.fontSize(9).fillColor("#B8C9D7").text("\u57FA\u4E8E\u8FD1\u671F\u529F\u80FD\u72B6\u6001\u3001\u751F\u6D3B\u65B9\u5F0F\u53CA\u8F83\u65E2\u5F80\u53D8\u5316\u5F62\u6210\u7684\u5065\u5EB7\u7BA1\u7406\u53C2\u8003", MARGIN, 105, { width: CONTENT_WIDTH });
  statusPill(doc, model.followUpLabel, MARGIN, 132, model.safetyNotice ? colors.red : colors.orange, 128);
  doc.fontSize(8).fillColor("#B8C9D7").text(`\u751F\u6210\u65F6\u95F4 ${model.submittedAt}`, PAGE_WIDTH - MARGIN - 180, 140, { width: 180, align: "right", lineBreak: false });
  const infoY = 196;
  const infoGap = 10;
  const infoWidth = (CONTENT_WIDTH - infoGap * 2) / 3;
  [
    ["\u59D3\u540D", model.name],
    ["\u624B\u673A\u53F7", model.phone],
    ["\u8BB0\u5F55\u7F16\u53F7", model.confirmationId]
  ].forEach(([heading2, content], index) => {
    const x = MARGIN + index * (infoWidth + infoGap);
    roundedPanel(doc, x, infoY, infoWidth, 62, colors.pale);
    label(doc, heading2, x + 14, infoY + 12);
    value(doc, content, x + 14, infoY + 31, infoWidth - 28, 10.5, colors.ink, 20);
  });
  sectionTitle(doc, "1", "\u5F53\u524D\u6700\u5173\u6CE8\u7684\u95EE\u9898", 282, "\u7528\u4E8E\u5B89\u6392\u5065\u5EB7\u6C9F\u901A\u548C\u540E\u7EED\u7BA1\u7406\u4F18\u5148\u7EA7");
  const concernY = 326;
  const concernGap = 10;
  const concernWidth = (CONTENT_WIDTH - concernGap * 2) / 3;
  const concerns = [...model.concerns, "\u672A\u586B\u5199", "\u672A\u586B\u5199"].slice(0, 3);
  concerns.forEach((concern, index) => {
    const x = MARGIN + index * (concernWidth + concernGap);
    roundedPanel(doc, x, concernY, concernWidth, 58, colors.white);
    doc.save().circle(x + 22, concernY + 29, 12).fill(index === 0 ? colors.orange : colors.blue).restore();
    doc.fontSize(9).fillColor(colors.white).text(String(index + 1), x + 13, concernY + 23, { width: 18, align: "center", lineBreak: false });
    value(doc, concern, x + 42, concernY + 18, concernWidth - 53, 10.5, colors.ink, 30);
  });
  const compareY = 400;
  const compareWidth = (CONTENT_WIDTH - 12) / 2;
  roundedPanel(doc, MARGIN, compareY, compareWidth, 72, "#F8FBFE");
  label(doc, "\u6700\u8FD1\u534A\u5E74\u6700\u660E\u663E\u53D8\u5316", MARGIN + 15, compareY + 14);
  value(doc, model.mainChange, MARGIN + 15, compareY + 35, compareWidth - 30, 12, colors.navy, 24);
  roundedPanel(doc, MARGIN + compareWidth + 12, compareY, compareWidth, 72, "#F8FBFE");
  label(doc, "\u672A\u676512\u5468\u9996\u8981\u6539\u5584\u76EE\u6807", MARGIN + compareWidth + 27, compareY + 14);
  value(doc, model.primaryGoal, MARGIN + compareWidth + 27, compareY + 35, compareWidth - 30, 12, colors.navy, 24);
  sectionTitle(doc, "2", "\u516B\u7EF4\u72B6\u6001\u6982\u89C8", 500, "\u53EA\u5C55\u793A\u5206\u7C7B\u6570\u91CF\uFF0C\u4E0D\u8BA1\u7B97\u603B\u5206\u3001\u767E\u5206\u6BD4\u6216\u8EAB\u4F53\u5E74\u9F84");
  const summaryY = 548;
  const total = Math.max(1, model.statusCounts.evaluate + model.statusCounts.signal + model.statusCounts.stable);
  const segments = [
    { label: "\u5EFA\u8BAE\u8BC4\u4F30", count: model.statusCounts.evaluate, color: colors.orange },
    { label: "\u53D8\u5316\u4FE1\u53F7", count: model.statusCounts.signal, color: colors.blue },
    { label: "\u57FA\u672C\u7A33\u5B9A", count: model.statusCounts.stable, color: colors.green }
  ];
  let segmentX = MARGIN;
  segments.forEach((segment, index) => {
    const remaining = PAGE_WIDTH - MARGIN - segmentX;
    const width = index === segments.length - 1 ? remaining : Math.max(4, CONTENT_WIDTH * (segment.count / total));
    doc.save().roundedRect(segmentX, summaryY, width, 18, 4).fill(segment.color).restore();
    segmentX += width;
  });
  segments.forEach((segment, index) => {
    const x = MARGIN + index * (CONTENT_WIDTH / 3);
    doc.save().circle(x + 5, summaryY + 43, 5).fill(segment.color).restore();
    doc.fontSize(9).fillColor(colors.muted).text(segment.label, x + 17, summaryY + 36, { lineBreak: false });
    doc.fontSize(19).fillColor(colors.navy).text(String(segment.count), x + 17, summaryY + 51, { lineBreak: false });
  });
  const noticeY = 646;
  roundedPanel(doc, MARGIN, noticeY, CONTENT_WIDTH, model.safetyNotice ? 82 : 70, model.safetyNotice ? "#FFF5F2" : "#F2FAF8", model.safetyNotice ? "#F4C7BD" : "#C9E9DF");
  doc.save().circle(MARGIN + 22, noticeY + 25, 9).fill(model.safetyNotice ? colors.red : colors.green).restore();
  doc.fontSize(9).fillColor(colors.white).text("!", MARGIN + 17, noticeY + 18, { width: 10, align: "center", lineBreak: false });
  doc.fontSize(10.5).fillColor(model.safetyNotice ? colors.red : colors.green).text(
    model.safetyNotice ? "\u533B\u5B66\u5B89\u5168\u4FE1\u606F\u63D0\u793A" : "\u62A5\u544A\u4F7F\u7528\u8FB9\u754C",
    MARGIN + 40,
    noticeY + 15,
    { lineBreak: false }
  );
  value(
    doc,
    model.safetyNotice ?? "\u672C\u62A5\u544A\u7528\u4E8E\u5065\u5EB7\u8BC4\u4F30\u4E0E\u7BA1\u7406\u6C9F\u901A\uFF0C\u4E0D\u4F5C\u4E3A\u75BE\u75C5\u8BCA\u65AD\u6216\u72EC\u7ACB\u68C0\u6D4B\u7ED3\u8BBA\u3002",
    MARGIN + 40,
    noticeY + 36,
    CONTENT_WIDTH - 58,
    9,
    colors.ink,
    34
  );
}
function drawDomains(doc, model) {
  sectionTitle(doc, "3", "\u516B\u7EF4\u529F\u80FD\u72B6\u6001\u753B\u50CF", 69, "\u72B6\u6001\u6765\u81EA\u95EE\u5377\u4F53\u611F\u7EBF\u7D22\uFF0C\u9700\u7ED3\u5408\u4F53\u68C0\u3001\u5B9E\u9A8C\u5BA4\u548C\u65E2\u5F80\u5065\u5EB7\u8D44\u6599\u7EFC\u5408\u5224\u65AD");
  const gapX = 12;
  const cardWidth = (CONTENT_WIDTH - gapX) / 2;
  const cardHeight = 154;
  const gapY = 12;
  const startY = 118;
  model.domains.slice(0, 8).forEach((domain2, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + column * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);
    const accent = levelColor(domain2.level);
    roundedPanel(doc, x, y, cardWidth, cardHeight, colors.white);
    doc.save().roundedRect(x, y, 5, cardHeight, 3).fill(accent).restore();
    value(doc, domain2.title, x + 17, y + 15, cardWidth - 132, 12, colors.navy, 22);
    statusPill(doc, domain2.levelLabel, x + cardWidth - 110, y + 12, accent, 96);
    label(doc, "\u4E3B\u8981\u7EBF\u7D22", x + 17, y + 52);
    value(doc, domain2.reason, x + 17, y + 68, cardWidth - 34, 9, colors.ink, 30);
    label(doc, "\u5065\u5EB7\u7BA1\u7406\u5EFA\u8BAE", x + 17, y + 101);
    value(doc, domain2.recommendation, x + 17, y + 117, cardWidth - 34, 8.5, colors.muted, 29);
  });
}
function drawLifestyleAndGoals(doc, model) {
  sectionTitle(doc, "4", "\u751F\u6D3B\u65B9\u5F0F\u6982\u89C8", 69, "\u7ED3\u6784\u5316\u5448\u73B0\u5F71\u54CD\u7761\u7720\u3001\u4EE3\u8C22\u3001\u6062\u590D\u548C\u529F\u80FD\u50A8\u5907\u7684\u65E5\u5E38\u56E0\u7D20");
  const gapX = 12;
  const cardWidth = (CONTENT_WIDTH - gapX) / 2;
  const cardHeight = 57;
  const gapY = 10;
  const startY = 116;
  model.lifestyle.slice(0, 8).forEach((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + column * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);
    roundedPanel(doc, x, y, cardWidth, cardHeight, index % 3 === 0 ? "#F2FAF8" : "#F7FAFD");
    label(doc, item.label, x + 14, y + 10);
    value(doc, item.value, x + 14, y + 28, cardWidth - 28, 10, colors.ink, 22);
  });
  sectionTitle(doc, "5", "\u672A\u676512\u5468\u884C\u52A8\u76EE\u6807", 404, "\u9009\u62E9\u5C11\u91CF\u3001\u53EF\u6267\u884C\u7684\u6539\u53D8\uFF0C\u5E76\u5728\u7B2C4\u30018\u300112\u5468\u89C2\u5BDF\u4F53\u611F\u53D8\u5316");
  const goalY = 451;
  const goalGap = 10;
  const goalWidth = (CONTENT_WIDTH - goalGap * 2) / 3;
  const goals = [...model.twelveWeekGoals, "\u5C1A\u672A\u9009\u62E9", "\u5C1A\u672A\u9009\u62E9"].slice(0, 3);
  goals.forEach((goal, index) => {
    const x = MARGIN + index * (goalWidth + goalGap);
    roundedPanel(doc, x, goalY, goalWidth, 67, colors.white);
    doc.save().circle(x + 20, goalY + 21, 10).fill(index === 0 ? colors.orange : colors.cyan).restore();
    doc.fontSize(8).fillColor(colors.white).text(String(index + 1), x + 12, goalY + 16, { width: 16, align: "center", lineBreak: false });
    value(doc, goal, x + 14, goalY + 39, goalWidth - 28, 9.5, colors.ink, 23);
  });
  roundedPanel(doc, MARGIN, 536, CONTENT_WIDTH, 62, "#F3F8FC");
  label(doc, "\u9996\u8981\u6539\u5584\u76EE\u6807", MARGIN + 16, 550, colors.blue);
  value(doc, model.primaryGoal, MARGIN + 130, 546, CONTENT_WIDTH - 146, 13, colors.navy, 28);
  sectionTitle(doc, "6", "\u5EFA\u8BAE\u7684\u540E\u7EED\u8DEF\u5F84", 624);
  const steps = [
    ["01", "\u8865\u5145\u68C0\u6D4B", "\u6839\u636E\u8BC4\u4F30\u7EBF\u7D22\u786E\u5B9A\u4F53\u68C0\u3001\u5B9E\u9A8C\u5BA4\u6216\u4E13\u9879\u68C0\u6D4B\u3002"],
    ["02", "\u786E\u5B9A\u4F18\u5148\u7EA7", "\u7ED3\u5408\u65E2\u5F80\u8D44\u6599\uFF0C\u786E\u5B9A\u5F53\u524D\u6700\u503C\u5F97\u5148\u7BA1\u7406\u7684\u65B9\u5411\u3002"],
    ["03", "\u8DDF\u8E2A\u53D8\u5316", "\u5236\u5B9A12\u5468\u65B9\u6848\uFF0C\u5E76\u5728\u7B2C4\u30018\u300112\u5468\u590D\u8BC4\u3002"]
  ];
  const stepY = 665;
  const stepGap = 10;
  const stepWidth = (CONTENT_WIDTH - stepGap * 2) / 3;
  steps.forEach(([number, heading2, copy2], index) => {
    const x = MARGIN + index * (stepWidth + stepGap);
    doc.fontSize(18).fillColor("#B8D4E5").text(number, x, stepY, { lineBreak: false });
    doc.fontSize(10.5).fillColor(colors.navy).text(heading2, x + 37, stepY + 4, { lineBreak: false });
    value(doc, copy2, x, stepY + 31, stepWidth, 8.5, colors.muted, 42);
  });
  doc.fontSize(7.5).fillColor(colors.muted).text(
    "\u8BF4\u660E\uFF1A\u672C\u95EE\u5377\u4E0D\u662F\u75BE\u75C5\u8BCA\u65AD\u5DE5\u5177\uFF0C\u4E5F\u4E0D\u72EC\u7ACB\u5224\u65AD\u751F\u7269\u5E74\u9F84\u3002\u6B63\u5F0F\u8BC4\u4F30\u9700\u7ED3\u5408\u5F53\u524D\u4F53\u68C0\u4E0E\u5B9E\u9A8C\u5BA4\u68C0\u6D4B\u3001\u65E2\u5F80\u5065\u5EB7\u8D44\u6599\u53CA\u4E13\u9879\u68C0\u6D4B\u3002",
    MARGIN,
    756,
    { width: CONTENT_WIDTH, align: "left", lineGap: 2 }
  );
}
function renderHospitalClientReportPdf(model, fontPath) {
  return new Promise((resolve, reject) => {
    const doc = new import_pdfkit.default({
      size: "A4",
      margin: 0,
      autoFirstPage: true,
      bufferPages: true,
      compress: true,
      info: {
        Title: `${model.institution} ${model.title}`,
        Author: model.institution,
        Subject: `\u8BB0\u5F55\u7F16\u53F7 ${model.confirmationId}`,
        Creator: "\u5EFA\u59CB\u6C11\u65CF\u533B\u9662\u5065\u5EB7\u95EE\u5377\u7CFB\u7EDF"
      }
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    try {
      doc.registerFont("NotoSansSC", fontPath);
      doc.font("NotoSansSC");
      drawCover(doc, model);
      pageChrome(doc, model, 1);
      doc.addPage({ size: "A4", margin: 0 });
      doc.font("NotoSansSC");
      drawDomains(doc, model);
      pageChrome(doc, model, 2);
      doc.addPage({ size: "A4", margin: 0 });
      doc.font("NotoSansSC");
      drawLifestyleAndGoals(doc, model);
      pageChrome(doc, model, 3);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// functions/submitSurvey/src/wecom.ts
var import_form_data = __toESM(require("form-data"));
var WECOM_UPLOAD_TIMEOUT_MS = 15e3;
var WeComDeliveryError = class extends Error {
  constructor(message, deliveryCode) {
    super(message);
    this.deliveryCode = deliveryCode;
    this.name = "WeComDeliveryError";
  }
  deliveryCode;
};
function safeInline(value3) {
  return value3.replace(/[\r\n<>`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
function displayPhone(phone) {
  if (!phone || !/^1\d{10}$/.test(phone)) return "\u672A\u63D0\u4F9B";
  return phone;
}
var hospitalConcernLabelMap = new Map(
  findHospitalQuestion("topConcerns")?.options?.map((option) => [option.value, option.label]) ?? []
);
var hospitalMainChangeLabelMap = new Map(
  findHospitalQuestion("mainChange")?.options?.map((option) => [option.value, option.label]) ?? []
);
var concernMarkers = ["\u2460", "\u2461", "\u2462"];
function hospitalConcernLabels(record) {
  const selected = record.healthAnswers.topConcerns;
  if (!Array.isArray(selected)) return "\u672A\u586B\u5199";
  const labels2 = [...new Set(selected.map(String))].map((value3) => hospitalConcernLabelMap.get(value3)).filter((value3) => Boolean(value3)).slice(0, 3).map(safeInline);
  return labels2.length ? labels2.map((label3, index) => `${concernMarkers[index]} ${label3}`).join("\u3000") : "\u672A\u586B\u5199";
}
function answerLabel(labels2, value3) {
  return labels2.get(String(value3 ?? "")) ?? "\u672A\u586B\u5199";
}
function primaryGoalLabel(record) {
  const selected = record.healthAnswers.topConcerns;
  const goal = String(record.healthAnswers.singleImprovement ?? "");
  if (!Array.isArray(selected) || !selected.map(String).includes(goal)) return "\u672A\u586B\u5199";
  return answerLabel(hospitalConcernLabelMap, goal);
}
function followUpStatus(record) {
  if (record.session.hasRedFlag) return '<font color="warning">\u9700\u533B\u52A1\u4EBA\u5458\u4F18\u5148\u6838\u5B9E</font>';
  const evaluate = record.assessment.domains.filter(({ level }) => level === "evaluate").length;
  const signal2 = record.assessment.domains.filter(({ level }) => level === "signal").length;
  if (evaluate >= 2) return '<font color="warning">\u5EFA\u8BAE\u91CD\u70B9\u8DDF\u8FDB</font>';
  if (evaluate + signal2 > 0) return '<font color="comment">\u5B58\u5728\u53D8\u5316\u4FE1\u53F7</font>';
  return '<font color="info">\u5E38\u89C4\u5065\u5EB7\u7BA1\u7406</font>';
}
function statusOverview(record) {
  if (record.session.hasRedFlag) return '<font color="warning">\u5B89\u5168\u4FE1\u606F\u5F85\u4EBA\u5DE5\u6838\u5B9E</font>';
  const count = (level) => record.assessment.domains.filter((domain2) => domain2.level === level).length;
  return [
    `<font color="warning">\u8BC4\u4F30 ${count("evaluate")}</font>`,
    `<font color="comment">\u53D8\u5316 ${count("signal")}</font>`,
    `<font color="info">\u7A33\u5B9A ${count("stable")}</font>`
  ].join("\uFF5C");
}
function shanghaiSubmittedAt(value3) {
  const date = new Date(value3);
  if (Number.isNaN(date.getTime())) return "\u65F6\u95F4\u5F85\u6838\u5B9E";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date).map((part) => [part.type, part.value])
  );
  return `${parts.month}\u6708${parts.day}\u65E5 ${parts.hour}:${parts.minute}`;
}
function buildWeComMarkdown(record) {
  return [
    "### \u{1F3E5} \u5EFA\u59CB\u6C11\u65CF\u533B\u9662\uFF5C\u65B0\u5065\u5EB7\u95EE\u5377",
    "",
    `\u{1F6A6} **\u8DDF\u8FDB\u7B49\u7EA7**\uFF1A${followUpStatus(record)}`,
    "",
    `\u{1F464} **\u59D3\u540D**\uFF1A${safeInline(record.identity.name)}`,
    `\u{1F4F1} **\u624B\u673A\u53F7**\uFF1A${displayPhone(record.identity.phone)}`,
    `\u{1F3AF} **\u4E3B\u8981\u95EE\u9898**\uFF1A${hospitalConcernLabels(record)}`,
    `\u{1F50E} **\u6700\u660E\u663E\u53D8\u5316**\uFF1A${answerLabel(hospitalMainChangeLabelMap, record.healthAnswers.mainChange)}`,
    `\u2B50 **\u9996\u8981\u6539\u5584\u76EE\u6807**\uFF1A${primaryGoalLabel(record)}`,
    "",
    `\u{1F4CA} **\u72B6\u6001\u6982\u89C8**\uFF1A${statusOverview(record)}`,
    "",
    `\u{1F552} **\u63D0\u4EA4\u65F6\u95F4**\uFF1A${shanghaiSubmittedAt(record.session.submittedAt)}`,
    `\u{1F9FE} **\u8BB0\u5F55\u7F16\u53F7**\uFF1A${safeInline(record.session.confirmationId)}`
  ].join("\n");
}
var femalePriorityLabelMap = new Map(
  findFemaleQuestion("f53")?.options?.map((option) => [option.value, option.label]) ?? []
);
var femaleLifecycleLabelMap = new Map(
  findFemaleQuestion("f5")?.options?.map((option) => [option.value, option.label]) ?? []
);
function femalePriorityLabels(record) {
  const selected = record.healthAnswers.f53;
  if (!Array.isArray(selected)) return "\u672A\u586B\u5199";
  const labels2 = [...new Set(selected.map(String))].map((value3) => femalePriorityLabelMap.get(value3)).filter((value3) => Boolean(value3)).slice(0, 3).map(safeInline);
  return labels2.length ? labels2.map((label3, index) => `${concernMarkers[index]} ${label3}`).join("\u3000") : "\u672A\u586B\u5199";
}
function femaleHealthRating(record) {
  const value3 = Number(record.healthAnswers.f55);
  return Number.isInteger(value3) && value3 >= 0 && value3 <= 10 ? `${value3} / 10` : "\u672A\u586B\u5199";
}
function buildFemaleWeComMarkdown(record) {
  return [
    "### \u{1F33A} \u5EFA\u59CB\u6C11\u65CF\u533B\u9662\uFF5C\u5973\u6027\u5065\u5EB7\u95EE\u5377",
    "",
    `\u{1F6A6} **\u8DDF\u8FDB\u7B49\u7EA7**\uFF1A${followUpStatus(record)}`,
    "",
    `\u{1F464} **\u59D3\u540D**\uFF1A${safeInline(record.identity.name)}`,
    `\u{1F4F1} **\u624B\u673A\u53F7**\uFF1A${displayPhone(record.identity.phone)}`,
    `\u{1F3AF} **\u91CD\u70B9\u5173\u6CE8**\uFF1A${femalePriorityLabels(record)}`,
    `\u{1F33F} **\u751F\u547D\u5468\u671F**\uFF1A${answerLabel(femaleLifecycleLabelMap, record.healthAnswers.f5)}`,
    `\u2728 **\u6574\u4F53\u5065\u5EB7\u81EA\u8BC4**\uFF1A${femaleHealthRating(record)}`,
    "",
    `\u{1F4CA} **\u516B\u7EF4\u6982\u89C8**\uFF1A${statusOverview(record)}`,
    "",
    `\u{1F552} **\u63D0\u4EA4\u65F6\u95F4**\uFF1A${shanghaiSubmittedAt(record.session.submittedAt)}`,
    `\u{1F9FE} **\u8BB0\u5F55\u7F16\u53F7**\uFF1A${safeInline(record.session.confirmationId)}`
  ].join("\n");
}
var twelveWeekGoalLabels2 = new Map(
  maleHealthV1.sections.flatMap((section) => section.questions).find((question2) => question2.id === "twelveWeekGoals")?.options?.map((option) => [option.value, option.label]) ?? []
);
function domainTitles(record, level) {
  const titles = record.assessment.domains.filter((domain2) => domain2.level === level).map((domain2) => safeInline(domain2.title));
  return titles.length ? titles.join("\u3001") : "\u65E0";
}
function selectedGoalLabels(record) {
  const selected = record.healthAnswers.twelveWeekGoals;
  if (!Array.isArray(selected)) return "\u672A\u586B\u5199";
  const labels2 = selected.slice(0, 3).map((value3) => twelveWeekGoalLabels2.get(String(value3))).filter((value3) => Boolean(value3)).map(safeInline);
  return labels2.length ? labels2.join("\u3001") : "\u672A\u586B\u5199";
}
function buildNuomaYuanyiWeComMarkdown(record) {
  const safetyStatus = record.session.hasRedFlag ? '<font color="warning">\u5B58\u5728\u533B\u5B66\u5B89\u5168\u7EA2\u65D7\uFF0C\u9700\u4F18\u5148\u4EBA\u5DE5\u6838\u5B9E</font>' : '<font color="info">\u672A\u53D1\u73B0\u533B\u5B66\u5B89\u5168\u7EA2\u65D7</font>';
  return [
    "### \u8BFA\u739B\u5143\u4E00\uFF5C\u65B0\u95EE\u5377\u6982\u8981",
    `> \u5B89\u5168\u72B6\u6001\uFF1A${safetyStatus}`,
    `> \u8BB0\u5F55\u7F16\u53F7\uFF1A${safeInline(record.session.confirmationId)}`,
    `> \u63D0\u4EA4\u65F6\u95F4\uFF1A${safeInline(record.session.submittedAt)}`,
    "",
    `**\u5EFA\u8BAE\u8FDB\u4E00\u6B65\u8BC4\u4F30**\uFF1A${domainTitles(record, "evaluate")}`,
    `**\u5B58\u5728\u53D8\u5316\u4FE1\u53F7**\uFF1A${domainTitles(record, "signal")}`,
    `**12\u5468\u76EE\u6807**\uFF1A${selectedGoalLabels(record)}`,
    "",
    "\u7FA4\u5185\u4EC5\u5C55\u793A\u8131\u654F\u6982\u8981\uFF0C\u8BF7\u51ED\u8BB0\u5F55\u7F16\u53F7\u5728\u53D7\u4FDD\u62A4\u7CFB\u7EDF\u5185\u6838\u5B9E\u5B8C\u6574\u4FE1\u606F\u3002"
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
async function uploadWeComFile(webhookUrl, filename, file, fetcher = fetch) {
  const webhook = validateWebhook(webhookUrl);
  const uploadUrl = new URL("/cgi-bin/webhook/upload_media", webhook.origin);
  uploadUrl.searchParams.set("key", webhook.searchParams.get("key"));
  uploadUrl.searchParams.set("type", "file");
  try {
    const form = new import_form_data.default();
    form.append("media", file, {
      filename,
      contentType: "application/octet-stream",
      knownLength: file.length
    });
    const multipartBody = form.getBuffer();
    const headers = {
      ...form.getHeaders(),
      "content-length": String(multipartBody.length)
    };
    const response2 = await fetcher(uploadUrl, {
      method: "POST",
      headers,
      body: new Uint8Array(multipartBody),
      signal: AbortSignal.timeout(WECOM_UPLOAD_TIMEOUT_MS)
    });
    const result = await response2.json();
    if (!response2.ok) throw new WeComDeliveryError("\u4F01\u4E1A\u5FAE\u4FE1\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25", `http_${response2.status}`);
    if (result.errcode !== 0) {
      throw new WeComDeliveryError("\u4F01\u4E1A\u5FAE\u4FE1\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25", `api_${result.errcode ?? "unknown"}`);
    }
    if (!result.media_id) throw new WeComDeliveryError("\u4F01\u4E1A\u5FAE\u4FE1\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25", "missing_media_id");
    return result.media_id;
  } catch (error) {
    if (error instanceof WeComDeliveryError) throw error;
    throw new WeComDeliveryError("\u4F01\u4E1A\u5FAE\u4FE1\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25", "network_or_parse");
  }
}
async function sendWeComFile(webhookUrl, mediaId, fetcher = fetch) {
  const url = validateWebhook(webhookUrl);
  try {
    const response2 = await fetcher(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ msgtype: "file", file: { media_id: mediaId } }),
      signal: AbortSignal.timeout(5e3)
    });
    const result = await response2.json();
    if (!response2.ok || result.errcode !== 0) throw new Error("rejected");
  } catch {
    throw new Error("\u4F01\u4E1A\u5FAE\u4FE1\u6587\u4EF6\u53D1\u9001\u5931\u8D25");
  }
}

// functions/submitSurvey/src/female-report-model.ts
var levelLabels2 = {
  clinical_priority: "\u4F18\u5148\u4E34\u5E8A\u6838\u5B9E",
  evaluate: "\u5EFA\u8BAE\u8FDB\u4E00\u6B65\u8BC4\u4F30",
  signal: "\u5B58\u5728\u53D8\u5316\u4FE1\u53F7",
  stable: "\u57FA\u672C\u7A33\u5B9A"
};
function labels(id) {
  return new Map(findFemaleQuestion(id)?.options?.map((option) => [option.value, option.label]) ?? []);
}
function safeText2(value3, fallback = "\u672A\u586B\u5199", maxLength = 160) {
  const text = String(value3 ?? "").replace(/[\u0000-\u001f\u007f<>`\[\]]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
  return text || fallback;
}
function single2(record, id) {
  return labels(id).get(String(record.healthAnswers[id] ?? "")) ?? "\u672A\u586B\u5199";
}
function multi(record, id) {
  const answer = record.healthAnswers[id];
  if (!Array.isArray(answer)) return [];
  const map = labels(id);
  return [...new Set(answer.map(String))].map((value3) => map.get(value3)).filter((value3) => Boolean(value3)).map((value3) => safeText2(value3));
}
function submittedAt(value3) {
  const date = new Date(value3);
  if (Number.isNaN(date.getTime())) return "\u65F6\u95F4\u5F85\u6838\u5B9E";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}\u5E74${parts.month}\u6708${parts.day}\u65E5 ${parts.hour}:${parts.minute}`;
}
function followUp(record) {
  if (record.session.hasRedFlag || record.assessment.hasRedFlag) return "\u9700\u533B\u52A1\u4EBA\u5458\u4F18\u5148\u6838\u5B9E";
  const evaluate = record.assessment.domains.filter((domain2) => domain2.level === "evaluate").length;
  const signal2 = record.assessment.domains.filter((domain2) => domain2.level === "signal").length;
  if (evaluate >= 2) return "\u5EFA\u8BAE\u91CD\u70B9\u8DDF\u8FDB";
  if (evaluate + signal2 > 0) return "\u5B58\u5728\u53D8\u5316\u4FE1\u53F7";
  return "\u5E38\u89C4\u5065\u5EB7\u7BA1\u7406";
}
function buildFemaleClientReportModel(record) {
  const hasRedFlag = record.session.hasRedFlag || record.assessment.hasRedFlag;
  const counts = (level) => record.assessment.domains.filter((domain2) => domain2.level === level).length;
  const assessment = record.assessment;
  const attention = new Set(assessment.screeningAttention ?? []);
  const healthScore = Number(record.healthAnswers.f55);
  return {
    institution: "\u5EFA\u59CB\u6C11\u65CF\u533B\u9662",
    title: "\u5973\u6027\u5065\u5EB7\u4E0E\u529F\u80FD\u72B6\u6001\u8BC4\u4F30\u62A5\u544A",
    name: safeText2(record.identity.name, "\u672A\u586B\u5199", 80),
    phone: /^1\d{10}$/.test(record.identity.phone ?? "") ? record.identity.phone : "\u672A\u63D0\u4F9B",
    ageLabel: single2(record, "f4"),
    confirmationId: safeText2(record.session.confirmationId, "\u8BB0\u5F55\u7F16\u53F7\u5F85\u6838\u5B9E", 80),
    submittedAt: submittedAt(record.session.submittedAt),
    followUpLabel: followUp(record),
    lifecycle: single2(record, "f5"),
    concerns: multi(record, "f53").slice(0, 3),
    healthRating: Number.isInteger(healthScore) && healthScore >= 0 && healthScore <= 10 ? healthScore : null,
    statusCounts: { evaluate: counts("evaluate"), signal: counts("signal"), stable: counts("stable") },
    domains: record.assessment.domains.slice(0, 8).map((domain2) => ({
      title: safeText2(domain2.title, "\u672A\u547D\u540D\u65B9\u5411", 40),
      level: hasRedFlag ? "clinical_priority" : domain2.level,
      levelLabel: levelLabels2[hasRedFlag ? "clinical_priority" : domain2.level],
      reason: hasRedFlag ? "\u533B\u5B66\u5B89\u5168\u4FE1\u606F\u9700\u8981\u533B\u52A1\u4EBA\u5458\u4F18\u5148\u6838\u5B9E" : safeText2(domain2.reasons[0], "\u5F53\u524D\u76F8\u5173\u4F53\u611F\u57FA\u672C\u7A33\u5B9A", 100),
      recommendation: hasRedFlag ? "\u8BF7\u5148\u7531\u533B\u52A1\u4EBA\u5458\u5B8C\u6210\u4FE1\u606F\u6838\u5B9E\u4E0E\u98CE\u9669\u5224\u65AD\u3002" : safeText2(domain2.recommendation, "\u5EFA\u8BAE\u4FDD\u6301\u5F53\u524D\u6709\u5229\u4E60\u60EF\u5E76\u6301\u7EED\u89C2\u5BDF\u53D8\u5316\u3002", 180)
    })),
    screenings: [
      { label: "\u5BAB\u9888\u7B5B\u67E5", value: single2(record, "f39"), attention: attention.has("\u5BAB\u9888\u7B5B\u67E5\u5B89\u6392\u53EF\u4E0E\u533B\u52A1\u4EBA\u5458\u8FDB\u4E00\u6B65\u786E\u8BA4") },
      { label: "\u4E73\u817A\u5F71\u50CF", value: single2(record, "f40"), attention: attention.has("\u4E73\u817A\u5F71\u50CF\u68C0\u67E5\u5B89\u6392\u53EF\u4E0E\u533B\u52A1\u4EBA\u5458\u8FDB\u4E00\u6B65\u786E\u8BA4") },
      { label: "\u7ED3\u76F4\u80A0\u7B5B\u67E5", value: single2(record, "f52"), attention: attention.has("\u7ED3\u76F4\u80A0\u7B5B\u67E5\u5B89\u6392\u53EF\u4E0E\u533B\u52A1\u4EBA\u5458\u8FDB\u4E00\u6B65\u786E\u8BA4") }
    ],
    lifestyle: [
      { label: "\u8FD0\u52A8\u72B6\u6001", value: single2(record, "f46") },
      { label: "\u996E\u98DF\u7ED3\u6784", value: multi(record, "f47").join("\u3001") || "\u672A\u586B\u5199" },
      { label: "\u5438\u70DF\u4E0E\u996E\u9152", value: multi(record, "f48").join("\u3001") || "\u672A\u586B\u5199" },
      { label: "\u8FD13\u4E2A\u6708\u7528\u836F", value: multi(record, "f45").join("\u3001") || "\u672A\u586B\u5199" }
    ],
    healthContext: [
      { label: "\u65E2\u5F80\u5065\u5EB7", value: multi(record, "f49").join("\u3001") || "\u672A\u586B\u5199" },
      { label: "\u957F\u671F\u4F7F\u7528", value: multi(record, "f50").join("\u3001") || "\u672A\u586B\u5199" },
      { label: "\u5BB6\u65CF\u5065\u5EB7", value: multi(record, "f51").join("\u3001") || "\u672A\u586B\u5199" }
    ],
    safetyNotice: hasRedFlag ? "\u533B\u5B66\u5B89\u5168\u4FE1\u606F\u9700\u8981\u533B\u52A1\u4EBA\u5458\u4F18\u5148\u6838\u5B9E\uFF0C\u8BF7\u5148\u5B8C\u6210\u98CE\u9669\u5224\u65AD\uFF0C\u518D\u51B3\u5B9A\u5065\u5EB7\u7BA1\u7406\u8DEF\u5F84\u3002" : null
  };
}

// functions/submitSurvey/src/female-report-pdf.ts
var import_pdfkit2 = __toESM(require("pdfkit"));
var W = 595.28;
var H = 841.89;
var M = 44;
var CW = W - M * 2;
var PAGES = 3;
var c = {
  plum: "#5E245D",
  plumDeep: "#351739",
  iris: "#7658C4",
  coral: "#DD6A72",
  gold: "#C79D55",
  teal: "#198E82",
  ink: "#34263A",
  muted: "#786A7A",
  line: "#E8DDE5",
  ivory: "#FFFAF2",
  lilac: "#F6F0FA",
  rose: "#FFF0EF",
  mint: "#EDF8F5",
  white: "#FFFFFF",
  red: "#B94259"
};
var levelColor2 = (level) => ({
  clinical_priority: c.red,
  evaluate: c.coral,
  signal: c.iris,
  stable: c.teal
})[level];
function safePart(value3, max) {
  return [...value3.replace(/[^\p{L}\p{N} _.\-]/gu, "").replace(/\s+/g, "")].slice(0, max).join("") || "\u672A\u547D\u540D";
}
function femaleClientReportFilename(model) {
  return `\u5EFA\u59CB\u6C11\u65CF\u533B\u9662_\u5973\u6027\u5065\u5EB7\u8BC4\u4F30\u62A5\u544A_${safePart(model.name, 24)}_${safePart(model.confirmationId, 40)}.pdf`;
}
function panel(doc, x, y, w, h, fill = c.white, stroke = c.line, r = 12) {
  doc.save().roundedRect(x, y, w, h, r).fillAndStroke(fill, stroke).restore();
}
function label2(doc, text, x, y, color = c.muted) {
  doc.fontSize(8).fillColor(color).text(text, x, y, { lineBreak: false });
}
function value2(doc, text, x, y, w, size = 10.5, color = c.ink, h = 36) {
  doc.fontSize(size).fillColor(color).text(text, x, y, { width: w, height: h, ellipsis: true, lineGap: 2 });
}
function pill(doc, text, x, y, color, w = 104) {
  doc.save().roundedRect(x, y, w, 23, 12).fill(color).restore();
  doc.fontSize(8.5).fillColor(c.white).text(text, x, y + 6, { width: w, align: "center", lineBreak: false });
}
function heading(doc, number, title, y, subtitle) {
  doc.save().circle(M + 10, y + 10, 10).fill(c.plum).restore();
  doc.fontSize(8.5).fillColor(c.white).text(number, M + 1, y + 5, { width: 18, align: "center", lineBreak: false });
  doc.fontSize(14.5).fillColor(c.plumDeep).text(title, M + 29, y + 1, { lineBreak: false });
  if (subtitle) doc.fontSize(8).fillColor(c.muted).text(subtitle, M + 29, y + 22, { width: CW - 29 });
}
function chrome(doc, model, page2) {
  if (page2 > 1) {
    const grad = doc.linearGradient(0, 0, W, 0).stop(0, c.plum).stop(0.56, c.iris).stop(1, c.coral);
    doc.save().rect(0, 0, W, 7).fill(grad).restore();
    doc.fontSize(9).fillColor(c.plumDeep).text(model.institution, M, 25, { lineBreak: false });
    doc.fontSize(8).fillColor(c.muted).text(model.title, M, 26, { width: CW, align: "right", lineBreak: false });
    doc.save().moveTo(M, 48).lineTo(W - M, 48).strokeColor(c.line).stroke().restore();
  }
  doc.save().moveTo(M, H - 39).lineTo(W - M, H - 39).strokeColor(c.line).stroke().restore();
  doc.fontSize(7.2).fillColor(c.muted).text(`\u8BB0\u5F55\u7F16\u53F7 ${model.confirmationId}`, M, H - 29, { lineBreak: false });
  doc.text(`\u7B2C ${page2} / ${PAGES} \u9875`, W - M - 74, H - 29, { width: 74, align: "right", lineBreak: false });
}
function cover(doc, model) {
  const grad = doc.linearGradient(0, 0, W, 188).stop(0, c.plumDeep).stop(0.55, c.plum).stop(1, c.iris);
  doc.save().rect(0, 0, W, 188).fill(grad).restore();
  doc.save().circle(W - 66, 40, 60).lineWidth(1).strokeColor("#BCA9E8").opacity(0.42).stroke().restore();
  doc.save().circle(W - 66, 40, 38).lineWidth(1).strokeColor("#F2A7A9").opacity(0.48).stroke().restore();
  doc.fontSize(11.5).fillColor("#E7D8E7").text(model.institution, M, 32, { lineBreak: false });
  doc.fontSize(24).fillColor(c.white).text(model.title, M, 62, { width: CW, lineBreak: false });
  doc.fontSize(8.7).fillColor("#DCCFDF").text("\u5973\u6027\u751F\u547D\u5468\u671F \xB7 \u529F\u80FD\u72B6\u6001 \xB7 \u751F\u6D3B\u65B9\u5F0F\u7684\u7EFC\u5408\u5065\u5EB7\u7BA1\u7406\u53C2\u8003", M, 101, { width: CW });
  pill(doc, model.followUpLabel, M, 132, model.safetyNotice ? c.red : c.coral, 132);
  doc.fontSize(7.8).fillColor("#DCCFDF").text(`\u751F\u6210\u65F6\u95F4 ${model.submittedAt}`, W - M - 185, 140, { width: 185, align: "right", lineBreak: false });
  const infoY = 207;
  const gap = 9;
  const iw = (CW - gap * 3) / 4;
  [["\u59D3\u540D", model.name], ["\u624B\u673A\u53F7", model.phone], ["\u5E74\u9F84", model.ageLabel], ["\u8BB0\u5F55\u7F16\u53F7", model.confirmationId]].forEach(([k, v], i) => {
    const x2 = M + i * (iw + gap);
    panel(doc, x2, infoY, iw, 57, i === 2 ? c.lilac : c.ivory);
    label2(doc, k, x2 + 12, infoY + 11);
    value2(doc, v, x2 + 12, infoY + 29, iw - 24, 9.5, c.ink, 19);
  });
  heading(doc, "1", "\u5F53\u524D\u5973\u6027\u5065\u5EB7\u753B\u50CF", 289, "\u53EA\u5448\u73B0\u95EE\u5377\u4F53\u611F\u5206\u7C7B\uFF0C\u4E0D\u8BA1\u7B97\u8870\u8001\u603B\u5206\u6216\u8EAB\u4F53\u5E74\u9F84");
  const focusY = 334;
  panel(doc, M, focusY, 314, 100, c.white);
  label2(doc, "\u5973\u6027\u751F\u547D\u5468\u671F\u72B6\u6001", M + 16, focusY + 14, c.plum);
  value2(doc, model.lifecycle, M + 16, focusY + 34, 282, 12.5, c.plumDeep, 43);
  doc.save().roundedRect(M + 16, focusY + 79, 188, 5, 2).fill(c.lilac).restore();
  doc.save().roundedRect(M + 16, focusY + 79, 118, 5, 2).fill(c.iris).restore();
  const scoreX = M + 326;
  panel(doc, scoreX, focusY, CW - 326, 100, c.lilac, "#DCCFE8");
  label2(doc, "\u6574\u4F53\u5065\u5EB7\u81EA\u8BC4", scoreX + 16, focusY + 14, c.plum);
  doc.fontSize(35).fillColor(c.plum).text(model.healthRating === null ? "-" : String(model.healthRating), scoreX + 15, focusY + 36, { lineBreak: false });
  doc.fontSize(10).fillColor(c.muted).text("/ 10", scoreX + 62, focusY + 57, { lineBreak: false });
  heading(doc, "2", "\u672C\u6B21\u91CD\u70B9\u5173\u6CE8", 458);
  const concernY = 498;
  const cg = 9;
  const cw = (CW - cg * 2) / 3;
  [...model.concerns, "\u672A\u586B\u5199", "\u672A\u586B\u5199"].slice(0, 3).forEach((text, i) => {
    const x2 = M + i * (cw + cg);
    panel(doc, x2, concernY, cw, 62, i === 0 ? c.rose : c.white, i === 0 ? "#F0C8CA" : c.line);
    doc.save().circle(x2 + 22, concernY + 31, 11).fill(i === 0 ? c.coral : c.iris).restore();
    doc.fontSize(8.5).fillColor(c.white).text(String(i + 1), x2 + 14, concernY + 25, { width: 16, align: "center", lineBreak: false });
    value2(doc, text, x2 + 41, concernY + 16, cw - 52, 9.5, c.ink, 34);
  });
  heading(doc, "3", "\u516B\u7EF4\u72B6\u6001\u6982\u89C8", 586);
  const sy = 628;
  const total = Math.max(1, model.statusCounts.evaluate + model.statusCounts.signal + model.statusCounts.stable);
  const segments = [["\u5EFA\u8BAE\u8BC4\u4F30", model.statusCounts.evaluate, c.coral], ["\u53D8\u5316\u4FE1\u53F7", model.statusCounts.signal, c.iris], ["\u57FA\u672C\u7A33\u5B9A", model.statusCounts.stable, c.teal]];
  let x = M;
  segments.forEach(([, count, color], i) => {
    const width = i === 2 ? W - M - x : Math.max(5, CW * count / total);
    doc.save().roundedRect(x, sy, width, 14, 4).fill(color).restore();
    x += width;
  });
  segments.forEach(([text, count, color], i) => {
    const sx = M + i * CW / 3;
    doc.save().circle(sx + 5, sy + 35, 4).fill(color).restore();
    doc.fontSize(8.5).fillColor(c.muted).text(text, sx + 15, sy + 29, { lineBreak: false });
    doc.fontSize(18).fillColor(c.plumDeep).text(String(count), sx + 15, sy + 44, { lineBreak: false });
  });
  const ny = 704;
  panel(doc, M, ny, CW, model.safetyNotice ? 72 : 61, model.safetyNotice ? c.rose : c.mint, model.safetyNotice ? "#EDB8BE" : "#C9E7DF");
  doc.save().circle(M + 21, ny + 22, 8).fill(model.safetyNotice ? c.red : c.teal).restore();
  doc.fontSize(8).fillColor(c.white).text("!", M + 16, ny + 16, { width: 10, align: "center", lineBreak: false });
  value2(doc, model.safetyNotice ?? "\u672C\u62A5\u544A\u7528\u4E8E\u5065\u5EB7\u8BC4\u4F30\u4E0E\u7BA1\u7406\u6C9F\u901A\uFF0C\u4E0D\u4F5C\u4E3A\u75BE\u75C5\u8BCA\u65AD\u6216\u72EC\u7ACB\u68C0\u6D4B\u7ED3\u8BBA\u3002", M + 38, ny + 15, CW - 52, 9, c.ink, 40);
}
function domainPage(doc, model) {
  heading(doc, "4", "\u516B\u7EF4\u5973\u6027\u529F\u80FD\u72B6\u6001\u753B\u50CF", 68, "\u6BCF\u4E2A\u65B9\u5411\u5747\u9700\u7ED3\u5408\u4F53\u68C0\u3001\u5B9E\u9A8C\u5BA4\u3001\u65E2\u5F80\u8D44\u6599\u53CA\u4E34\u5E8A\u9700\u8981\u7EFC\u5408\u5224\u65AD");
  const gapX = 11;
  const cardW = (CW - gapX) / 2;
  const cardH = 155;
  const gapY = 11;
  const startY = 116;
  model.domains.slice(0, 8).forEach((d, i) => {
    const x = M + i % 2 * (cardW + gapX);
    const y = startY + Math.floor(i / 2) * (cardH + gapY);
    const accent = levelColor2(d.level);
    panel(doc, x, y, cardW, cardH, i % 3 === 0 ? c.ivory : c.white);
    doc.save().roundedRect(x, y, 5, cardH, 3).fill(accent).restore();
    value2(doc, d.title, x + 16, y + 14, cardW - 126, 11.5, c.plumDeep, 23);
    pill(doc, d.levelLabel, x + cardW - 106, y + 11, accent, 94);
    label2(doc, "\u4E3B\u8981\u7EBF\u7D22", x + 16, y + 51);
    value2(doc, d.reason, x + 16, y + 66, cardW - 32, 8.7, c.ink, 31);
    label2(doc, "\u5EFA\u8BAE\u65B9\u5411", x + 16, y + 103);
    value2(doc, d.recommendation, x + 16, y + 118, cardW - 32, 8.2, c.muted, 29);
  });
}
function detailsPage(doc, model) {
  heading(doc, "5", "\u7B5B\u67E5\u65F6\u95F4\u4E0E\u5173\u6CE8\u9879", 68, "\u63D0\u793A\u4EC5\u7528\u4E8E\u4E0E\u533B\u52A1\u4EBA\u5458\u786E\u8BA4\u4E2A\u4F53\u5316\u5B89\u6392\uFF0C\u4E0D\u81EA\u52A8\u5224\u65AD\u7B5B\u67E5\u4E0D\u8DB3");
  const sy = 116;
  const gap = 10;
  const sw = (CW - gap * 2) / 3;
  model.screenings.forEach((item, i) => {
    const x = M + i * (sw + gap);
    panel(doc, x, sy, sw, 83, item.attention ? c.rose : c.mint, item.attention ? "#EDC2C6" : "#C9E7DF");
    label2(doc, item.label, x + 13, sy + 13, item.attention ? c.coral : c.teal);
    value2(doc, item.value, x + 13, sy + 33, sw - 26, 10.5, c.plumDeep, 30);
    doc.fontSize(7.3).fillColor(c.muted).text(item.attention ? "\u5EFA\u8BAE\u786E\u8BA4\u5B89\u6392" : "\u6309\u5F53\u524D\u8BB0\u5F55", x + 13, sy + 65, { lineBreak: false });
  });
  heading(doc, "6", "\u751F\u6D3B\u65B9\u5F0F\u6982\u89C8", 227);
  const ly = 269;
  const lw = (CW - 11) / 2;
  model.lifestyle.slice(0, 4).forEach((item, i) => {
    const x = M + i % 2 * (lw + 11);
    const y = ly + Math.floor(i / 2) * 70;
    panel(doc, x, y, lw, 59, i % 3 === 0 ? c.ivory : c.lilac);
    label2(doc, item.label, x + 13, y + 10);
    value2(doc, item.value, x + 13, y + 28, lw - 26, 9.3, c.ink, 23);
  });
  heading(doc, "7", "\u65E2\u5F80\u4E0E\u5BB6\u65CF\u5065\u5EB7\u7EBF\u7D22", 424);
  const hy = 465;
  const hw = (CW - gap * 2) / 3;
  model.healthContext.slice(0, 3).forEach((item, i) => {
    const x = M + i * (hw + gap);
    panel(doc, x, hy, hw, 69, c.white);
    label2(doc, item.label, x + 13, hy + 11, c.plum);
    value2(doc, item.value, x + 13, hy + 30, hw - 26, 9.2, c.ink, 29);
  });
  heading(doc, "8", "\u5EFA\u8BAE\u7684\u540E\u7EED\u8DEF\u5F84", 564);
  const steps = [["01", "\u4FE1\u606F\u6838\u5B9E", "\u533B\u52A1\u4EBA\u5458\u786E\u8BA4\u95EE\u5377\u7EBF\u7D22\u3001\u65E2\u5F80\u8D44\u6599\u548C\u7B5B\u67E5\u8BB0\u5F55\u3002"], ["02", "\u8865\u5145\u8BC4\u4F30", "\u6309\u4F18\u5148\u65B9\u5411\u9009\u62E9\u4F53\u68C0\u3001\u5B9E\u9A8C\u5BA4\u6216\u5973\u6027\u4E13\u9879\u68C0\u67E5\u3002"], ["03", "12\u5468\u7BA1\u7406", "\u786E\u5B9A\u53EF\u6267\u884C\u76EE\u6807\uFF0C\u5E76\u5728\u7B2C4\u30018\u300112\u5468\u89C2\u5BDF\u53D8\u5316\u3002"]];
  const py = 607;
  const pw = (CW - gap * 2) / 3;
  steps.forEach(([n, title, copy2], i) => {
    const x = M + i * (pw + gap);
    panel(doc, x, py, pw, 91, i === 0 ? c.rose : c.lilac);
    doc.fontSize(17).fillColor(i === 0 ? c.coral : c.iris).text(n, x + 13, py + 12, { lineBreak: false });
    doc.fontSize(10).fillColor(c.plumDeep).text(title, x + 49, py + 16, { lineBreak: false });
    value2(doc, copy2, x + 13, py + 45, pw - 26, 8.3, c.muted, 37);
  });
  panel(doc, M, 719, CW, 50, c.ivory, "#E9D9BD");
  doc.fontSize(7.5).fillColor(c.muted).text("\u8BF4\u660E\uFF1A\u672C\u95EE\u5377\u4E0D\u662F\u75BE\u75C5\u8BCA\u65AD\u5DE5\u5177\uFF0C\u4E5F\u4E0D\u72EC\u7ACB\u5224\u65AD\u751F\u7269\u5E74\u9F84\u3002\u6B63\u5F0F\u8BC4\u4F30\u9700\u7ED3\u5408\u5F53\u524D\u4F53\u68C0\u4E0E\u5B9E\u9A8C\u5BA4\u68C0\u6D4B\u3001\u65E2\u5F80\u5065\u5EB7\u8D44\u6599\u53CA\u4E13\u9879\u68C0\u6D4B\u3002", M + 14, 734, { width: CW - 28, lineGap: 2 });
}
function renderFemaleClientReportPdf(model, fontPath) {
  return new Promise((resolve, reject) => {
    const doc = new import_pdfkit2.default({ size: "A4", margin: 0, autoFirstPage: true, bufferPages: true, compress: true, info: { Title: `${model.institution} ${model.title}`, Author: model.institution, Subject: `\u8BB0\u5F55\u7F16\u53F7 ${model.confirmationId}`, Creator: "\u5EFA\u59CB\u6C11\u65CF\u533B\u9662\u5973\u6027\u5065\u5EB7\u95EE\u5377\u7CFB\u7EDF" } });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    try {
      doc.registerFont("NotoSansSC", fontPath);
      doc.font("NotoSansSC");
      cover(doc, model);
      chrome(doc, model, 1);
      doc.addPage({ size: "A4", margin: 0 });
      doc.font("NotoSansSC");
      domainPage(doc, model);
      chrome(doc, model, 2);
      doc.addPage({ size: "A4", margin: 0 });
      doc.font("NotoSansSC");
      detailsPage(doc, model);
      chrome(doc, model, 3);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// functions/submitSurvey/src/report-delivery.ts
async function deliverHospitalClientReport(record, webhookUrl, dependencies) {
  if (!webhookUrl) return "not_configured";
  const buildModel = dependencies.buildModel ?? buildHospitalClientReportModel;
  const renderPdf = dependencies.renderPdf ?? renderHospitalClientReportPdf;
  const filename = dependencies.filename ?? hospitalClientReportFilename;
  const upload = dependencies.upload ?? uploadWeComFile;
  const send = dependencies.send ?? sendWeComFile;
  const logError = dependencies.logError ?? console.log;
  let phase = "model";
  try {
    const model = buildModel(record);
    phase = "render";
    const pdf = await renderPdf(model, dependencies.fontPath);
    phase = "upload";
    const mediaId = await upload(webhookUrl, filename(model), pdf);
    phase = "send";
    await send(webhookUrl, mediaId);
    return "sent";
  } catch (error) {
    const code = error instanceof WeComDeliveryError ? `:${error.deliveryCode}` : "";
    logError(`hospital WeCom PDF report delivery failed (${phase}${code})`);
    return "failed";
  }
}
async function deliverFemaleClientReport(record, webhookUrl, dependencies) {
  if (!webhookUrl) return "not_configured";
  const buildModel = dependencies.buildModel ?? buildFemaleClientReportModel;
  const renderPdf = dependencies.renderPdf ?? renderFemaleClientReportPdf;
  const filename = dependencies.filename ?? femaleClientReportFilename;
  const upload = dependencies.upload ?? uploadWeComFile;
  const send = dependencies.send ?? sendWeComFile;
  const logError = dependencies.logError ?? console.log;
  let phase = "model";
  try {
    const model = buildModel(record);
    phase = "render";
    const pdf = await renderPdf(model, dependencies.fontPath);
    phase = "upload";
    const mediaId = await upload(webhookUrl, filename(model), pdf);
    phase = "send";
    await send(webhookUrl, mediaId);
    return "sent";
  } catch (error) {
    const code = error instanceof WeComDeliveryError ? `:${error.deliveryCode}` : "";
    logError(`hospital female WeCom PDF report delivery failed (${phase}${code})`);
    return "failed";
  }
}

// functions/submitSurvey/src/notification-workflow.ts
async function deliverResolvedWeComNotification(record, notification, dependencies) {
  if (!notification.webhookUrl) {
    return [
      { action: notification.auditAction, status: "not_configured" },
      ...notification.report ? [{ action: notification.report.auditAction, status: "not_configured" }] : []
    ];
  }
  const sendMarkdown = dependencies.sendMarkdown ?? sendWeComNotification;
  const deliverReport = dependencies.deliverReport ?? deliverHospitalClientReport;
  const deliverFemaleReport = dependencies.deliverFemaleReport ?? deliverFemaleClientReport;
  const logError = dependencies.logError ?? console.error;
  const audits = [];
  try {
    await sendMarkdown(notification.webhookUrl, notification.markdown);
    audits.push({ action: notification.auditAction, status: "sent" });
  } catch {
    logError(notification.failureLog);
    audits.push({ action: notification.auditAction, status: "failed" });
  }
  if (notification.report) {
    const status = notification.report.kind === "female" ? await deliverFemaleReport(record, notification.webhookUrl, { fontPath: dependencies.fontPath }) : await deliverReport(record, notification.webhookUrl, { fontPath: dependencies.fontPath });
    audits.push({ action: notification.report.auditAction, status });
  }
  return audits;
}

// functions/submitSurvey/src/notification.ts
function resolveWeComNotification(record, environment) {
  if (record.session.questionnaireVersion === "nuoma-yuanyi-male-health-v1.0") {
    return {
      webhookUrl: environment.NUOMA_YUANYI_WECOM_WEBHOOK_URL,
      markdown: buildNuomaYuanyiWeComMarkdown(record),
      auditAction: "nuoma_yuanyi_wecom_notification",
      failureLog: "Nuoma Yuanyi WeCom notification failed"
    };
  }
  if (record.session.questionnaireVersion === "female-health-v1.0" && record.identity.phone) {
    return {
      webhookUrl: environment.HOSPITAL_WECHAT_WEBHOOK_URL,
      markdown: buildFemaleWeComMarkdown(record),
      auditAction: "hospital_female_wecom_notification",
      failureLog: "hospital female WeCom notification failed",
      report: {
        kind: "female",
        auditAction: "hospital_female_wecom_report_notification",
        failureLog: "hospital female WeCom PDF report delivery failed"
      }
    };
  }
  if (record.session.questionnaireVersion === "male-health-v1.0" && record.identity.phone) {
    return {
      webhookUrl: environment.HOSPITAL_WECHAT_WEBHOOK_URL,
      markdown: buildWeComMarkdown(record),
      auditAction: "hospital_wecom_notification",
      failureLog: "hospital WeCom notification failed",
      report: {
        kind: "male",
        auditAction: "hospital_wecom_report_notification",
        failureLog: "hospital WeCom PDF report delivery failed"
      }
    };
  }
  return null;
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
    const notification = resolveWeComNotification(record, process.env);
    if (notification) {
      const audits = await deliverResolvedWeComNotification(record, notification, {
        fontPath: import_node_path.default.join(__dirname, "assets", "NotoSansCJKsc-Regular.otf")
      });
      for (const audit of audits) {
        try {
          await db.collection(collections.auditLogs).add({
            sessionId,
            action: audit.action,
            status: audit.status,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        } catch {
          console.error("WeCom notification audit write failed");
        }
      }
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
