// @vitest-environment node
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { FemaleClientReportModel } from "./female-report-model";
import { femaleClientReportFilename, renderFemaleClientReportPdf } from "./female-report-pdf";

const fontPath = fileURLToPath(new URL("../assets/NotoSansCJKsc-Regular.otf", import.meta.url));
const model: FemaleClientReportModel = {
  institution: "建始民族医院", title: "女性健康与功能状态评估报告", name: "虚构女性用户", phone: "13800138000", ageLabel: "50—54岁",
  confirmationId: "JS-FEMALE-TEST", submittedAt: "2026年08月14日 11:26", followUpLabel: "建议重点跟进", lifecycle: "已连续12个月以上没有月经",
  concerns: ["女性激素与围绝经期变化", "睡眠", "体重与腰腹脂肪"], healthRating: 8, statusCounts: { evaluate: 2, signal: 2, stable: 4 },
  domains: Array.from({ length: 8 }, (_, index) => ({ title: `女性健康方向${index + 1}`, level: index < 2 ? "evaluate" as const : index < 4 ? "signal" as const : "stable" as const, levelLabel: index < 2 ? "建议进一步评估" : index < 4 ? "存在变化信号" : "基本稳定", reason: "近期相关体感出现变化", recommendation: "建议结合体检资料持续观察并与医务人员沟通。" })),
  screenings: [{ label: "宫颈筛查", value: "从未做过", attention: true }, { label: "乳腺影像", value: "超过2年", attention: true }, { label: "结直肠筛查", value: "从未做过", attention: true }],
  lifestyle: [{ label: "运动状态", value: "每周运动1—2次" }, { label: "饮食结构", value: "蔬菜、水果、红肉或加工肉较多" }, { label: "吸烟与饮酒", value: "不吸烟、偶尔饮酒" }, { label: "近3个月用药", value: "抗生素" }],
  healthContext: [{ label: "既往健康", value: "血脂异常" }, { label: "长期使用", value: "钙或维生素D" }, { label: "家族健康", value: "糖尿病" }], safetyNotice: null,
};

describe("female client report PDF", () => {
  it("renders exactly three A4 pages", async () => {
    const pdf = await renderFemaleClientReportPdf(model, fontPath);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)).toHaveLength(3);
    expect(pdf.length).toBeGreaterThan(20_000);
  });

  it("uses a safe female-specific filename", () => {
    expect(femaleClientReportFilename(model)).toBe("建始民族医院_女性健康评估报告_虚构女性用户_JS-FEMALE-TEST.pdf");
  });
});
