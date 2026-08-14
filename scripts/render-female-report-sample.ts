import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import type { PersistedSubmission } from "../src/domain/submission";

const require = createRequire(import.meta.url);
const { buildFemaleClientReportModel } = require("../functions/submitSurvey/src/female-report-model.ts") as typeof import("../functions/submitSurvey/src/female-report-model");
const { femaleClientReportFilename, renderFemaleClientReportPdf } = require("../functions/submitSurvey/src/female-report-pdf.ts") as typeof import("../functions/submitSurvey/src/female-report-pdf");

const sample: PersistedSubmission = {
  session: { clientSubmissionId: "female-report-visual-test", confirmationId: "JS-FEMALE-VISUAL-TEST", questionnaireVersion: "female-health-v1.0", submittedAt: "2026-08-14T08:00:00.000Z", hasRedFlag: false },
  identity: { name: "虚构女性用户", age: 52, phone: "13800000000", phoneLast4: "0000" },
  healthAnswers: {
    f4: "2", f5: "4", f39: "4", f40: "2", f45: ["0", "3"], f46: "2", f47: ["0", "1", "2", "5"], f48: ["0", "4"],
    f49: ["2", "4"], f50: ["9"], f51: ["4", "6"], f52: "4", f53: ["0", "1", "4"], f55: 8,
  },
  assessment: {
    hasRedFlag: false,
    redFlags: [],
    screeningAttention: ["宫颈筛查安排可与医务人员进一步确认", "乳腺影像检查安排可与医务人员进一步确认", "结直肠筛查安排可与医务人员进一步确认"],
    domains: [
      { id: "femaleLifecycle", title: "女性生命周期", level: "evaluate", reasons: ["女性生命周期相关体感出现较明确变化"], recommendation: "建议结合生命周期阶段和实际体感，由医务人员判断是否需要女性激素或妇科方向评估。" },
      { id: "sleep", title: "睡眠状态", level: "evaluate", reasons: ["睡眠时长与恢复感出现变化"], recommendation: "建议进一步了解睡眠时长、睡眠质量及睡眠呼吸相关风险。" },
      { id: "mind", title: "情绪与认知", level: "signal", reasons: ["近期情绪或注意力存在轻微变化"], recommendation: "建议结合睡眠、压力与生活影响程度持续观察。" },
      { id: "metabolicCardio", title: "代谢与心血管体感", level: "evaluate", reasons: ["体重、腰腹与餐后体感出现组合变化"], recommendation: "建议结合血压、血糖、血脂、体成分及心血管风险因素进一步评估。" },
      { id: "musculoskeletal", title: "骨骼、肌肉与功能储备", level: "signal", reasons: ["活动与肌骨体感存在轻微变化"], recommendation: "建议结合骨密度、肌肉量、握力和基础运动能力进一步观察。" },
      { id: "breastGynecology", title: "乳腺与妇科健康线索", level: "stable", reasons: ["当前相关体感基本稳定"], recommendation: "建议按个人情况持续完成乳腺及妇科健康管理。" },
      { id: "urogenital", title: "泌尿生殖状态", level: "stable", reasons: ["当前相关体感基本稳定"], recommendation: "建议保持观察，如有变化及时与医务人员沟通。" },
      { id: "gutLifestyle", title: "胃肠、微生态与生活方式", level: "stable", reasons: ["当前相关体感基本稳定"], recommendation: "建议保持规律饮食与活动；问卷不判断菌群状态。" },
    ],
  } as PersistedSubmission["assessment"],
};

const model = buildFemaleClientReportModel(sample);
const fontPath = path.resolve("functions/submitSurvey/assets/NotoSansCJKsc-Regular.otf");
const mainRepository = "/Users/yaolijun/Documents/Codex/2026-08-13/https-github-com-yaolijun007-code-nuoma";
const outputDirectory = path.join(mainRepository, "output/pdf");
const outputPath = path.join(outputDirectory, femaleClientReportFilename(model));
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, await renderFemaleClientReportPdf(model, fontPath));
process.stdout.write(`${outputPath}\n`);
