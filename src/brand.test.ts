import { describe, expect, it } from "vitest";
import { getSurveyBrand } from "./brand";

describe("survey brands", () => {
  it("defines the independent Nuoma Yuanyi brand", () => {
    expect(getSurveyBrand("nuoma-yuanyi")).toMatchObject({
      organization: "诺玛元一",
      subtitle: "生命健康管理",
      questionnaireVersion: "nuoma-yuanyi-male-health-v1.0",
      draftKey: "nuoma.yuanyi.male-health.v1.draft",
      basePath: "/nuoma-yuanyi-survey/",
      themeClass: "theme-nuoma-yuanyi",
    });
  });

  it("preserves the hospital brand and rejects unknown builds", () => {
    expect(getSurveyBrand("hospital")).toMatchObject({
      organization: "建始民族医院",
      questionnaireVersion: "male-health-v1.0",
      basePath: "/health-survey/",
    });
    expect(() => getSurveyBrand("unknown")).toThrow("未知问卷品牌");
  });
});
