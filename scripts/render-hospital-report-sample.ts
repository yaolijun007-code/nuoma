import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type { PersistedSubmission } from "../src/domain/submission";

const require = createRequire(import.meta.url);
const { buildHospitalClientReportModel } = require("../functions/submitSurvey/src/report-model.ts") as
  typeof import("../functions/submitSurvey/src/report-model");
const { hospitalClientReportFilename, renderHospitalClientReportPdf } = require("../functions/submitSurvey/src/report-pdf.ts") as
  typeof import("../functions/submitSurvey/src/report-pdf");

const sample: PersistedSubmission = {
  session: {
    clientSubmissionId: "hospital-report-visual-test",
    confirmationId: "JS-VISUAL-TEST",
    questionnaireVersion: "male-health-v1.0",
    submittedAt: "2026-08-14T08:00:00.000Z",
    hasRedFlag: false,
  },
  identity: { name: "虚构用户", age: null, phone: "13800000000", phoneLast4: "0000" },
  healthAnswers: {
    topConcerns: ["0", "1", "4"],
    mainChange: "1",
    singleImprovement: "1",
    workStatus: "1",
    q41: "3",
    q42: "2",
    q43: "3",
    q44: "2",
    q45: "1",
    q46: "3",
    q47: ["0", "1", "2", "3"],
    twelveWeekGoals: ["0", "1", "8"],
  },
  assessment: {
    hasRedFlag: false,
    redFlags: [],
    domains: [
      { id: "energy", title: "精力与恢复", level: "evaluate", reasons: ["精力或恢复体感较既往出现变化"], recommendation: "存在进一步评估线索，建议与健康管理师共同确认优先方向。" },
      { id: "sleep", title: "睡眠与日间状态", level: "evaluate", reasons: ["存在睡眠质量或睡眠呼吸相关线索"], recommendation: "建议进一步完成标准化睡眠风险评估；必要时进入睡眠医学评估。" },
      { id: "mind", title: "压力与认知状态", level: "signal", reasons: ["压力、情绪或认知体感出现变化"], recommendation: "建议持续关注睡眠、压力和注意力变化。" },
      { id: "gut", title: "胃肠与排便状态", level: "stable", reasons: [], recommendation: "当前体感基本稳定，建议保持并持续观察变化。" },
      { id: "metabolism", title: "代谢相关体感", level: "evaluate", reasons: ["腹部、餐后体感或生活方式信号叠加"], recommendation: "建议进入血糖、血脂、肝脏、尿酸及体成分等方向评估。" },
      { id: "cardio", title: "心肺与运动能力", level: "stable", reasons: [], recommendation: "当前体感基本稳定，建议保持并持续观察变化。" },
      { id: "muscle", title: "肌肉与功能储备", level: "signal", reasons: ["力量或运动恢复出现变化"], recommendation: "建议逐步增加基础活动，并结合需要评估体成分和握力。" },
      { id: "maleUrology", title: "男性活力与泌尿状态", level: "stable", reasons: [], recommendation: "当前体感基本稳定，建议保持并持续观察变化。" },
    ],
  },
};

const model = buildHospitalClientReportModel(sample);
const fontPath = path.resolve("functions/submitSurvey/assets/NotoSansCJKsc-Regular.otf");
const outputDirectory = path.resolve("output/pdf");
const outputPath = path.join(outputDirectory, hospitalClientReportFilename(model));
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, await renderHospitalClientReportPdf(model, fontPath));
process.stdout.write(`${outputPath}\n`);
